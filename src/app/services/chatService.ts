// src/app/services/chatService.ts

// AI 服务走 /ai 代理 → /ump-client-ai-service（微服务架构）
const API_BASE = '/ai';

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
  fileIds?: string[];
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
  fileId?: string;
  fileIds?: string[];
  records?: Array<{
    recordId?: string;
    recordStatus?: string;
    status?: string;
    fileId?: string;
    title?: string;
    description?: string;
    tags?: string[];
    width?: number;
    height?: number;
    failureCode?: string;
    failureMessage?: string;
  }>;
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
  | 'artifact.failed'
  | 'artifact.metadata.completed'
  | 'task.completed'
  | 'task.failed'
  | 'task.rejected'
  | 'task.cancelled'
  | 'heartbeat';

export interface SSEImageInfo {
  recordId?: string;
  fileId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
}

export interface SSEMessage {
  type: SSEEventType;
  taskId: string;
  sessionId: string;
  occurredAt: string;
  seq: number;
  id?: string;
  streamId?: string;
  requestId?: string;
  serviceType?: string;
  remoteTaskId?: string;
  // task.phase
  phase?: string;
  // message.delta / message.completed
  messageId?: string;
  delta?: string;
  finishReason?: string;
  message?: string;
  // artifact.pending / artifact.ready / artifact.failed
  recordId?: string;
  recordIds?: string[];
  fileId?: string;
  fileIds?: string[];
  image?: SSEImageInfo;
  promptSummary?: string;
  images?: SSEImageInfo[];
  width?: number;
  height?: number;
  nsfwDetected?: boolean;
  totalCount?: number;
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

export type SSEConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed'
  | 'error';

export interface SSEConnectionEvent {
  state: SSEConnectionState;
  attempt: number;
  lastEventId?: string;
  retryInMs?: number;
  status?: number;
  message?: string;
}

export interface SubscribeEventsOptions {
  lastEventId?: string;
  onStatus?: (event: SSEConnectionEvent) => void;
  onError?: (event: SSEConnectionEvent) => void;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
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
  taskId?: string;
  role: string;
  text: string;
  images?: {
    recordId?: string;
    fileId?: string;
    title?: string;
    description?: string;
    tags?: string[];
    width?: number;
    height?: number;
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
   * @param options.onStatus 连接状态变化回调
   * @param options.onError 连接出现不可恢复错误时的回调
   * @returns close 函数，调用后关闭 SSE 连接
   */
  subscribeEvents: (
    taskId: string,
    onMessage: (msg: SSEMessage) => void,
    options?: SubscribeEventsOptions
  ) => {
    const token = localStorage.getItem('accessToken') ?? '';
    const initialLastEventId = options?.lastEventId?.trim() || '';
    const baseReconnectDelayMs = options?.reconnectDelayMs ?? 1500;
    const maxReconnectDelayMs = options?.maxReconnectDelayMs ?? 10000;

    let closed = false;
    let terminal = false;
    let attempt = 0;
    let lastEventId = initialLastEventId;
    let serverSuggestedRetryMs: number | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;
    let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const isRetryableStatus = (status: number) =>
      status === 408 ||
      status === 425 ||
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504;

    const emitStatus = (event: SSEConnectionEvent) => {
      options?.onStatus?.(event);
    };

    const emitError = (event: SSEConnectionEvent) => {
      options?.onError?.(event);
    };

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const cleanup = () => {
      if (closed) return;
      closed = true;
      terminal = true;
      clearReconnectTimer();
      activeController?.abort();
      if (activeReader) {
        void activeReader.cancel().catch(() => {});
      }
      emitStatus({
        state: 'closed',
        attempt,
        lastEventId: lastEventId || undefined,
      });
    };

    const emitTaskFailed = (message: string, status?: number) => {
      const failure: SSEMessage = {
        type: 'task.failed',
        taskId,
        sessionId: '',
        occurredAt: new Date().toISOString(),
        seq: 0,
        message,
        errorMessage: message,
        retriable: false,
      };
      onMessage(failure);
      emitError({
        state: 'error',
        attempt,
        lastEventId: lastEventId || undefined,
        status,
        message,
      });
    };

    const scheduleReconnect = (message: string, status?: number) => {
      if (closed || terminal) return;

      const retryDelay =
        serverSuggestedRetryMs ??
        Math.min(baseReconnectDelayMs * 2 ** Math.max(attempt - 1, 0), maxReconnectDelayMs);

      emitStatus({
        state: attempt === 0 ? 'connecting' : 'reconnecting',
        attempt: attempt + 1,
        lastEventId: lastEventId || undefined,
        retryInMs: retryDelay,
        status,
        message,
      });

      clearReconnectTimer();
      reconnectTimer = setTimeout(() => {
        if (!closed && !terminal) {
          void connect();
        }
      }, retryDelay);
    };

    const finalizeTerminalEvent = (msg: SSEMessage) => {
      terminal = true;
      activeController?.abort();
      if (activeReader) {
        void activeReader.cancel().catch(() => {});
      }
      emitStatus({
        state: 'closed',
        attempt,
        lastEventId: lastEventId || undefined,
      });
      onMessage(msg);
    };

    const parseEventPayload = (rawData: string, eventType: string | undefined, eventId: string | undefined) => {
      try {
        const parsed = JSON.parse(rawData) as SSEMessage & Record<string, unknown>;
        // 后端断线续传严格依赖 SSE frame 的 id（Redis Stream ID），不能退回到业务字段 requestId。
        const normalizedId = eventId || parsed.id || parsed.streamId;
        if (normalizedId) {
          lastEventId = String(normalizedId);
        }

        const finalMsg: SSEMessage = {
          ...parsed,
          type: (eventType as SSEEventType) ?? parsed.type,
          id: parsed.id ?? (eventId ? String(eventId) : undefined),
          streamId: parsed.streamId ?? (eventId ? String(eventId) : undefined),
          requestId: parsed.requestId ? String(parsed.requestId) : undefined,
          serviceType: parsed.serviceType ? String(parsed.serviceType) : undefined,
          remoteTaskId: parsed.remoteTaskId ? String(parsed.remoteTaskId) : undefined,
          message: parsed.message ? String(parsed.message) : undefined,
        };

        if (finalMsg.type === 'task.failed') {
          const failureMessage = finalMsg.message ?? finalMsg.errorMessage ?? '任务失败';
          finalMsg.message = failureMessage;
          finalMsg.errorMessage = failureMessage;
        }

        if (finalMsg.type !== 'heartbeat') {
          if (finalMsg.type === 'task.completed' || finalMsg.type === 'task.failed' || finalMsg.type === 'task.rejected' || finalMsg.type === 'task.cancelled') {
            finalizeTerminalEvent(finalMsg);
          } else {
            onMessage(finalMsg);
          }
        }
      } catch {
        // JSON 解析失败，忽略该事件
      }
    };

    const connect = async () => {
      while (!closed && !terminal) {
        const currentAttempt = attempt;
        const currentLastEventId = lastEventId || initialLastEventId;
        const query = new URLSearchParams();
        if (currentLastEventId) {
          query.set('lastEventId', currentLastEventId);
        }

        const requestUrl = `${API_BASE}/client/ai/tasks/${taskId}/events${query.toString() ? `?${query.toString()}` : ''}`;
        activeController = new AbortController();

        emitStatus({
          state: currentAttempt === 0 ? 'connecting' : 'reconnecting',
          attempt: currentAttempt + 1,
          lastEventId: currentLastEventId || undefined,
          retryInMs: currentAttempt === 0 ? undefined : serverSuggestedRetryMs ?? baseReconnectDelayMs,
        });

        try {
          const response = await fetch(requestUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(currentLastEventId ? { 'Last-Event-ID': currentLastEventId } : {}),
            },
            signal: activeController.signal,
          });

          if (closed || terminal) return;

          if (!response.ok) {
            const message = `SSE 连接失败: HTTP ${response.status}`;
            if (isRetryableStatus(response.status)) {
              attempt += 1;
              scheduleReconnect(message, response.status);
              return;
            }
            emitTaskFailed(message, response.status);
            return;
          }

          if (!response.body) {
            attempt += 1;
            scheduleReconnect('SSE response body 为空');
            return;
          }

          emitStatus({
            state: 'connected',
            attempt: currentAttempt + 1,
            lastEventId: currentLastEventId || undefined,
          });

          activeReader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let currentEvent: { type?: string; data?: string[]; id?: string; retry?: number } = {};

          const processLine = (rawLine: string) => {
            const line = rawLine;

            if (line === '') {
              if (currentEvent.data && currentEvent.data.length > 0) {
                parseEventPayload(currentEvent.data.join('\n'), currentEvent.type, currentEvent.id);
              }
              currentEvent = {};
              return;
            }

            if (line.startsWith(':')) return;

            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) {
              return;
            }

            const field = line.slice(0, colonIdx).trim();
            const value = line.slice(colonIdx + 1);

            switch (field) {
              case 'event':
                currentEvent.type = value.trim();
                break;
              case 'data':
                if (currentEvent.data) {
                  currentEvent.data.push(value);
                } else {
                  currentEvent.data = [value];
                }
                break;
              case 'id':
                currentEvent.id = value.trim();
                if (currentEvent.id) {
                  lastEventId = currentEvent.id;
                }
                break;
              case 'retry': {
                const parsedRetry = Number(value.trim());
                if (Number.isFinite(parsedRetry) && parsedRetry >= 0) {
                  currentEvent.retry = parsedRetry;
                  serverSuggestedRetryMs = parsedRetry;
                }
                break;
              }
              default:
                break;
            }
          };

          while (!closed && !terminal) {
            const { done, value } = await activeReader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const cleanLine = line.endsWith('\r') ? line.slice(0, -1) : line;
              processLine(cleanLine);
              if (closed || terminal) {
                break;
              }
            }
          }

          if (closed || terminal) {
            return;
          }

          attempt += 1;
          scheduleReconnect('SSE 连接中断，正在重连');
        } catch (err) {
          if (closed || terminal) {
            return;
          }

          if ((err as Error)?.name === 'AbortError') {
            return;
          }

          const message = (err as Error)?.message || String(err);
          attempt += 1;
          scheduleReconnect(message);
        } finally {
          activeReader = null;
        }
      }
    };

    void connect();

    return { close: cleanup };
  },
};
