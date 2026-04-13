// src/app/services/chatService.ts

const API_BASE = '/api';

// SSE 直接请求后端（不走 Vite 代理），与 Vite 代理 target 一致
const SSE_BASE = 'http://xxx.ga-ga.xyz:19080';

// ==================== 类型定义 ====================

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
  requestId?: string;
}

// 提交消息
export interface SendMessageRequest {
  sessionId?: string;
  clientMessageId: string;
  text?: string;
  objectKeys?: string[];
  imageStyle?: string;
}

export interface SendMessageResponse {
  sessionId: string;
  userMessageId: string;
  taskId: string;
  status: string;
  phase: string;
  queuePosition: number | null;
  estimatedWaitMs: number | null;
}

// 任务快照
export interface ArtifactSummary {
  status: string;
  requestId: string;
  objectKey: string;
  objectKeys: string[];
  promptSummary: string;
  remoteStatus: string;
  width: number;
  height: number;
  nsfwDetected: boolean;
}

export interface TaskSnapshot {
  taskId: string;
  sessionId: string;
  userMessageId: string;
  assistantMessageId: string;
  assistantText: string;
  assistantFinishReason: string;
  status: string;
  phase: string;
  queuePosition: number | null;
  estimatedWaitMs: number | null;
  lastEventId: string;
  lastEventSeq: number;
  error: { code: string; message: string; retriable: boolean } | null;
  artifact: ArtifactSummary | null;
  actions: { canCancel: boolean; canRetry: boolean; canResume: boolean };
}

// SSE 事件
export type SSEEventType =
  | 'queue.updated'
  | 'task.phase'
  | 'message.delta'
  | 'message.completed'
  | 'artifact.pending'
  | 'artifact.ready'
  | 'task.completed'
  | 'task.failed'
  | 'task.rejected'
  | 'task.cancelled'
  | 'heartbeat';

export interface SSEMessage {
  type: SSEEventType;
  taskId: string;
  sessionId: string;
  occurredAt: string;
  seq: number;
  // task.phase
  phase?: string;
  // message.delta / message.completed
  messageId?: string;
  delta?: string;
  finishReason?: string;
  // artifact.ready
  objectKey?: string;
  objectKeys?: string[];
  promptSummary?: string;
  width?: number;
  height?: number;
  nsfwDetected?: boolean;
  // task.failed
  stage?: string;
  code?: string;
  errorMessage?: string;
  retriable?: boolean;
  // task.rejected
  displayText?: string;
  // task.cancelled
  reason?: string;
  // queue.updated
  position?: number;
  estimatedWaitMs?: number;
}

// 会话
export interface SessionRecord {
  sessionId: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  createTime: string;
}

export interface ConversationMessage {
  messageId: string;
  role: string;
  text: string;
  images: {
    objectKey: string;
    title: string;
    description: string;
    tags: string[];
    width: number;
    height: number;
  }[];
  seq: number;
  createTime: string;
}

// ==================== 内部请求函数 ====================

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 检查 HTTP 状态码
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      message = errData.message || message;
    } catch {
      // 非 JSON 响应，使用状态码消息
    }
    throw new Error(message);
  }

  const data = await response.json();

  if (data.code !== 0 && data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

// ==================== 导出方法 ====================

export const chatService = {
  /**
   * 提交消息，发起 AI 对话任务
   * POST /client/ai/messages
   */
  submitMessage: (data: SendMessageRequest) =>
    request<SendMessageResponse>('/client/ai/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * 获取任务快照
   * GET /client/ai/tasks/{taskId}
   */
  getTaskSnapshot: (taskId: string) =>
    request<TaskSnapshot>(`/client/ai/tasks/${taskId}`),

  /**
   * 取消任务
   * POST /client/ai/tasks/{taskId}/cancel
   */
  cancelTask: (taskId: string) =>
    request<{ taskId: string; status: string; phase: string }>(
      `/client/ai/tasks/${taskId}/cancel`,
      { method: 'POST' }
    ),

  /**
   * 列举会话列表
   * POST /client/ai/sessions/list
   */
  listSessions: (params: { page: number; size: number; keyword?: string }) =>
    request<{
      records: SessionRecord[];
      total: number;
      pageNum: number;
      pageSize: number;
      pages: number;
    }>('/client/ai/sessions/list', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  /**
   * 获取会话消息列表
   * GET /client/ai/sessions/{sessionId}/messages
   */
  getConversationMessages: (sessionId: string) =>
    request<ConversationMessage[]>(
      `/client/ai/sessions/${sessionId}/messages`
    ),

  /**
   * 订阅任务 SSE 事件流
   * GET /client/ai/tasks/{taskId}/events
   *
   * 使用 fetch + ReadableStream 实现（原生 EventSource 不支持自定义 Header），
   * SSE 直连后端，不走 Vite 代理。
   *
   * @param taskId 任务 ID
   * @param onMessage 每条 SSE 消息的回调（heartbeat 事件除外）
   * @param options.lastEventId 从上次断开的事件 ID 继续（用于断线重连）
   * @returns close 函数，调用后关闭 SSE 连接
   */
  subscribeEvents: (
    taskId: string,
    onMessage: (msg: SSEMessage) => void,
    options?: { lastEventId?: string }
  ) => {
    const token = localStorage.getItem('accessToken') ?? '';
    const params = new URLSearchParams({
      lastEventId: options?.lastEventId ?? '',
    });

    let closed = false;

    const cleanup = () => {
      closed = true;
    };

    fetch(`${SSE_BASE}/client/ai/tasks/${taskId}/events?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`SSE 连接失败: HTTP ${response.status}`);
        }
        if (!response.body) {
          throw new Error('SSE response body 为空');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // SSE 事件状态机：累积字段直到遇到空行（事件结束）
        let currentEvent: { type?: string; data?: string; id?: string } = {};

        const processLine = (rawLine: string) => {
          const line = rawLine;

          // 空行 → 事件结束，解析并回调
          if (line === '') {
            if (currentEvent.data !== undefined) {
              try {
                const msg: SSEMessage = JSON.parse(currentEvent.data);
                // event 字段覆盖 msg 自带的 type
                const finalMsg: SSEMessage = {
                  ...msg,
                  type: (currentEvent.type as SSEEventType) ?? msg.type,
                };
                if (finalMsg.type !== 'heartbeat') {
                  onMessage(finalMsg);
                }
              } catch {
                // JSON 解析失败，忽略该事件
              }
            }
            currentEvent = {};
            return;
          }

          // 注释行，忽略
          if (line.startsWith(':')) return;

          // 字段行: field-name[:value]
          // value 前可能有空格（空格是 field-value 的一部分，跳过前导空格）
          const colonIdx = line.indexOf(':');
          if (colonIdx === -1) {
            // 无 colon 的行：可能是多行 data 的续行（以空格开头）
            // 按 SSE 规范，多行 data 续行的首字符是空格（` ` 或 `\t`）
            const stripped = line.replace(/^[ \t]+/, '');
            if (stripped && currentEvent.data !== undefined) {
              // 这是 data 字段的续行，将内容追加到 currentEvent.data
              // 当前行内容（去掉前导空格后）应拼到当前 data 末尾
              // 但更简洁的做法：直接追加（空行已处理了 `\n`）
              currentEvent.data += stripped;
            }
            return;
          }

          const field = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1); // value 不做 trim，让续行的空格自然处理

          switch (field) {
            case 'event':
              currentEvent.type = value.trim();
              break;
            case 'data':
              // SSE 中多个 data: 行会按出现顺序拼接（用换行连接）
              if (currentEvent.data !== undefined) {
                currentEvent.data += '\n' + value;
              } else {
                currentEvent.data = value;
              }
              break;
            case 'id':
              currentEvent.id = value.trim();
              break;
            // 忽略其他字段
          }
        };

        const read = () => {
          reader
            .read()
            .then(({ done, value }) => {
              if (done || closed) {
                reader.cancel();
                return;
              }

              buffer += decoder.decode(value, { stream: true });

              // 按 '\n' 分行，处理每一行
              const lines = buffer.split('\n');
              // 最后一行可能是未完成的行（没有 '\n' 结尾），保留在 buffer
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                // 去掉行尾的 '\r'（兼容 Windows CRLF）
                const cleanLine = line.endsWith('\r')
                  ? line.slice(0, -1)
                  : line;
                processLine(cleanLine);
              }

              if (!closed) {
                read();
              }
            })
            .catch(() => {
              // reader 被取消，忽略
            });
        };

        read();
      })
      .catch((err) => {
        if (!closed) {
          onMessage({
            type: 'task.failed',
            taskId,
            sessionId: '',
            occurredAt: new Date().toISOString(),
            seq: 0,
            errorMessage: (err as Error).message || String(err),
          });
        }
      });

    return { close: cleanup };
  },
};
