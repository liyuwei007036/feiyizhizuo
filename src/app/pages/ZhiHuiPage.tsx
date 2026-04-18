import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import type { MyPattern } from '../context/AppContext';
import { toast } from 'sonner';
import {
  Plus, Send, Sparkles, X, RotateCcw, Loader2, Clock,
  ZoomIn, Bookmark, BookmarkCheck, CheckCircle2, AlertCircle,
  Image as ImageIcon, Wifi, WifiOff,
} from 'lucide-react';
import {
  chatService,
  type SSEConnectionState,
  type SSEConnectionEvent,
  type SSEImageInfo,
  type SSEMessage,
} from '../services/chatService';
import { uploadChatImage } from '../services/uploadService';
import { ProtectedImage } from '../components/ProtectedImage';

const CATEGORIES = [
  { id: 'yunjin', name: '云锦', nameEn: 'Yunjin', enabled: true },
  { id: 'songjin', name: '宋锦', nameEn: 'Songjin', enabled: false },
  { id: 'shujin', name: '蜀锦', nameEn: 'Shujin', enabled: false },
  { id: 'kesi', name: '缂丝', nameEn: 'Kesi', enabled: false },
  { id: 'cixiu', name: '刺绣', nameEn: 'Embroidery', enabled: false },
  { id: 'mudiao', name: '木雕', nameEn: 'Woodcraft', enabled: false },
  { id: 'taoci', name: '陶瓷', nameEn: 'Ceramics', enabled: false },
  { id: 'qiqi', name: '漆器', nameEn: 'Lacquerware', enabled: false },
  { id: 'jianzhi', name: '剪纸', nameEn: 'Papercutting', enabled: false },
  { id: 'kehui', name: '刻绘', nameEn: 'Carving', enabled: false },
] as const;

const DEFAULT_CATEGORY = CATEGORIES.find(category => category.enabled) ?? CATEGORIES[0];

const SAMPLE_PROMPTS = [
  '生成一组适合南京城市礼赠场景的云锦纹样，整体偏典雅、祥瑞、稳重，适合高端礼盒包装',
  '参考凤凰纹样草图，转化为更现代的云锦风格图案，保留传统骨架，降低复杂度',
  '根据客户 brief 生成 4 个可提案方向，客户为知名白酒品牌，需要兼顾文化气质与现代感',
];

// Category color map for session list badges
const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  云锦: { bg: 'rgba(196,145,42,0.1)', text: '#C4912A' },
  宋锦: { bg: 'rgba(26,61,74,0.08)', text: '#1A3D4A' },
  蜀锦: { bg: 'rgba(255,105,180,0.1)', text: '#FF69B4' },
  缂丝: { bg: 'rgba(107,79,138,0.1)', text: '#6B4F8A' },
  刺绣: { bg: 'rgba(255,165,0,0.1)', text: '#FFA500' },
  木雕: { bg: 'rgba(26,61,74,0.06)', text: '#6B6558' },
  陶瓷: { bg: 'rgba(26,61,74,0.06)', text: '#6B6558' },
  漆器: { bg: 'rgba(255,215,0,0.1)', text: '#FFD700' },
  剪纸: { bg: 'rgba(255,140,0,0.1)', text: '#FF8C00' },
  刻绘: { bg: 'rgba(139,0,0,0.1)', text: '#8B0000' },
};

interface Session {
  id: string;
  title: string;
  category: string;
  time: string;
  group: 'today' | 'week' | 'month';
}

interface GeneratedPattern {
  id: string;
  status: 'pending' | 'ready' | 'failed';
  taskId?: string;
  requestId?: string;
  recordId?: string;
  fileId?: string;
  title: string;
  desc: string;
  tags: string[];
  style: string;
  scene: string;
  imageUrl: string;
  errorCode?: string;
  errorMessage?: string;
  retriable?: boolean;
}

type PersistedTaskRecord = {
  sessionId: string;
  taskId: string;
  assistantMessageId: string | null;
  lastEventId: string | null;
  status: string | null;
  phase: string | null;
  queuePosition: number | null;
  estimatedWaitMs: number | null;
  requestId: string | null;
  patterns: GeneratedPattern[];
  updatedAt: number;
};

type ConvMessage = {
  id: string;
  role: 'user' | 'system';
  content: string;
  category?: string;
  timestamp: string;
  taskId?: string;
  assistantMessageId?: string;
  lastEventId?: string;
  lastEventSeq?: number;
  status?: string;
  phase?: string;
  queuePosition?: number | null;
  estimatedWaitMs?: number | null;
  requestId?: string;
  recordId?: string;
  recordIds?: string[];
  artifactStatus?: string;
  artifact?: {
    status?: string;
    requestId?: string;
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
    promptSummary?: string;
    remoteStatus?: string;
    width?: number;
    height?: number;
    nsfwDetected?: boolean;
  };
  images?: ConversationImage[];
};

type ConversationImage = {
  recordId?: string;
  fileId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
};

type TaskEventLogItem = {
  id: string;
  kind: 'event' | 'connection';
  title: string;
  detail?: string;
  eventType?: string;
  connectionState?: SSEConnectionState;
  occurredAt: number;
};

type InputAttachment = {
  localId: string;
  fileName: string;
  fileId?: string;
  status: 'uploading' | 'ready' | 'failed';
  error?: string;
};

type PatternStatus = GeneratedPattern['status'];

const PATTERN_STATUS_LABELS: Record<PatternStatus, string> = {
  pending: '生成中',
  ready: '已完成',
  failed: '生成失败',
};

const ACTIVE_TASK_STORAGE_KEY = 'zhihui:active-task-map:v1';
const TASK_EVENT_LOG_LIMIT = 12;
const RECOVERABLE_TASK_STATUSES = new Set(['PENDING', 'RUNNING', 'CANCEL_REQUESTED']);

const readPersistedTaskMap = (): Record<string, PersistedTaskRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ACTIVE_TASK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, PersistedTaskRecord>;
  } catch {
    return {};
  }
};

const writePersistedTaskMap = (taskMap: Record<string, PersistedTaskRecord>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_TASK_STORAGE_KEY, JSON.stringify(taskMap));
  } catch {
    // ignore storage write failures
  }
};

// ── Image Zoom Modal ──────────────────────────────────────────────────────────

function ImageZoomModal({ pattern, isSaved, onToggleSave, onRegen, onClose }: {
  pattern: GeneratedPattern;
  isSaved: boolean;
  onToggleSave: () => void;
  onRegen: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(10,20,30,0.94)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{ background: '#0B1822' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <X className="w-4 h-4 text-white/80" />
        </button>

        <div className="flex-1 min-h-0 px-6 pt-6 pb-4 md:px-10 md:pt-10">
          <div className="flex h-full items-center justify-center">
            <ProtectedImage
              src={pattern.imageUrl}
              alt={pattern.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        <div
          className="shrink-0 border-t px-6 py-5 md:px-10"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(to top, rgba(11,24,34,0.96) 0%, rgba(11,24,34,0.88) 100%)',
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-white" style={{ fontSize: 20, fontWeight: 600 }}>{pattern.title}</p>
                {pattern.tags.length > 0 && (
                  <>
                  {pattern.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full px-2.5 py-1 text-xs"
                      style={{ background: 'rgba(196,145,42,0.3)', color: '#F5D88A', backdropFilter: 'blur(4px)' }}
                    >
                      {tag}
                    </span>
                  ))}
                  </>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{pattern.desc}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onToggleSave}
                className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm transition-all"
                style={isSaved
                  ? { background: 'rgba(13,148,136,0.15)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.3)' }
                  : { background: 'linear-gradient(135deg, #C4912A, #D9A83C)', color: '#0B1822' }
                }
              >
                {isSaved ? <><BookmarkCheck className="w-4 h-4" /> 已收录至我的纹库</> : <><Bookmark className="w-4 h-4" /> 收录至我的纹库</>}
              </button>
              <button
                type="button"
                onClick={() => { onRegen(); onClose(); }}
                className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <RotateCcw className="w-4 h-4" /> 再次生图
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type GenState =
  | 'idle'
  | 'queued'
  | 'inputReview'
  | 'planning'
  | 'textGenerating'
  | 'promptRewrite'
  | 'imageSubmit'
  | 'imageWaitCallback'
  | 'cancelRequested'
  | 'finalizing'
  | 'done'
  | 'failed'
  | 'interrupted'
  | 'rejected'
  | 'cancelled';

const TASK_STAGE_COPY: Record<Exclude<GenState, 'idle'>, string> = {
  queued: '任务已进入队列，正在等待调度...',
  inputReview: '正在校验输入内容与创作约束...',
  planning: '正在拆解创作意图并规划纹样结构...',
  textGenerating: '正在生成文本说明与创作结果...',
  promptRewrite: '正在重写提示词并补充风格约束...',
  imageSubmit: '正在提交图像生成请求...',
  imageWaitCallback: '正在等待图像服务回调...',
  cancelRequested: '已提交取消请求，等待任务收口...',
  finalizing: '正在收尾并整理最终结果...',
  done: '生成完成，可查看本轮结果',
  failed: '生成失败，请稍后重试',
  interrupted: '任务已中断，请重新发起创作',
  rejected: '内容审核未通过',
  cancelled: '任务已取消',
};

const TASK_STAGE_LABELS: Record<Exclude<GenState, 'idle' | 'done' | 'failed' | 'interrupted' | 'rejected' | 'cancelled'>, string> = {
  queued: '排队',
  inputReview: '审核',
  planning: '规划',
  textGenerating: '生成',
  promptRewrite: '重写',
  imageSubmit: '提交',
  imageWaitCallback: '回调',
  cancelRequested: '取消中',
  finalizing: '收尾',
};

const ACTIVE_TASK_STEPS: Exclude<GenState, 'idle' | 'done' | 'failed' | 'interrupted' | 'rejected' | 'cancelled'>[] = [
  'queued',
  'inputReview',
  'planning',
  'textGenerating',
  'promptRewrite',
  'imageSubmit',
  'imageWaitCallback',
  'finalizing',
];

const TERMINAL_TASK_STATES = new Set<GenState>(['done', 'failed', 'interrupted', 'rejected', 'cancelled']);

const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: '排队中',
  RUNNING: '进行中',
  CANCEL_REQUESTED: '取消中',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
  FAILED: '失败',
  CANCELLED: '已取消',
  INTERRUPTED: '已中断',
};

const TASK_PHASE_LABELS: Record<string, string> = {
  QUEUED: '排队调度',
  INPUT_REVIEW: '输入审核',
  PLANNING: '任务规划',
  TEXT_GENERATING: '文本生成',
  PROMPT_REWRITE: '提示词重写',
  IMAGE_SUBMIT: '提交图片任务',
  IMAGE_WAIT_CALLBACK: '等待图片回调',
  FINALIZING: '最终收尾',
};

const TASK_EVENT_LABELS: Record<string, string> = {
  'queue.updated': '队列更新',
  'task.phase': '阶段切换',
  'message.delta': '文本增量',
  'message.completed': '文本完成',
  'artifact.pending': '图片提交成功',
  'artifact.ready': '图片已就绪',
  'artifact.failed': '图片生成失败',
  'artifact.metadata.completed': '图片元数据补齐',
  'task.completed': '任务完成',
  'task.failed': '任务失败',
  'task.rejected': '审核拒绝',
  'task.cancelled': '任务取消',
};

const CONNECTION_STATE_LABELS: Record<SSEConnectionState, string> = {
  connecting: '正在连接',
  connected: '连接正常',
  reconnecting: '正在重连',
  closed: '连接已关闭',
  error: '连接异常',
};

type RuntimeState = {
  status: string | null;
  phase: string | null;
  queuePosition: number | null;
  estimatedWaitMs: number | null;
  lastEventType: string | null;
  connectionState: SSEConnectionState | null;
  connectionMessage: string | null;
  requestId: string | null;
  serviceType: string | null;
  remoteTaskId: string | null;
};

const INITIAL_RUNTIME_STATE: RuntimeState = {
  status: null,
  phase: null,
  queuePosition: null,
  estimatedWaitMs: null,
  lastEventType: null,
  connectionState: null,
  connectionMessage: null,
  requestId: null,
  serviceType: null,
  remoteTaskId: null,
};

const resolveSessionGroup = (timeText?: string) => {
  if (!timeText) return 'month' as const;
  const sessionTime = new Date(timeText);
  if (Number.isNaN(sessionTime.getTime())) {
    return 'month' as const;
  }

  const diffDays = Math.floor((Date.now() - sessionTime.getTime()) / 86400000);
  if (diffDays <= 0) return 'today' as const;
  if (diffDays < 7) return 'week' as const;
  return 'month' as const;
};

const formatSessionTime = (timeText?: string) => {
  if (!timeText) return '';
  return new Date(timeText)
    .toLocaleString('zh', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/\//g, '-');
};

const formatMessageTime = (timeValue?: string | number | Date | null) =>
  new Date(timeValue ?? Date.now()).toLocaleTimeString('zh', {
    hour: '2-digit',
    minute: '2-digit',
  });

const normalizeArtifactStatus = (status?: string | null): PatternStatus | null => {
  if (!status) return null;
  const normalized = status.trim().toUpperCase();
  if (
    normalized === 'READY' ||
    normalized === 'DONE' ||
    normalized === 'COMPLETED' ||
    normalized === 'SUCCESS'
  ) {
    return 'ready';
  }
  if (
    normalized === 'FAILED' ||
    normalized === 'CANCELLED' ||
    normalized === 'CANCELED'
  ) {
    return 'failed';
  }
  if (
    normalized === 'PENDING' ||
    normalized === 'PENDING_SUBMIT' ||
    normalized === 'SUBMITTED' ||
    normalized === 'SUBMITTING' ||
    normalized === 'WAITING_CALLBACK' ||
    normalized === 'IMAGE_WAIT_CALLBACK'
  ) {
    return 'pending';
  }
  return null;
};

const normalizeTaskStatus = (status?: string | null) => status?.trim().toUpperCase() || '';

const shouldReplayTask = (status?: string | null) => {
  const normalized = normalizeTaskStatus(status);
  return !normalized || RECOVERABLE_TASK_STATUSES.has(normalized);
};

const shouldClearPersistedTask = (status?: string | null) =>
  normalizeTaskStatus(status) === 'COMPLETED';

export function ZhiHuiPage() {
  const { t, clearRedDot, addLibraryPattern, removeLibraryPattern, savedLibraryPatterns } = useApp();
  const navigate = useNavigate();
  const selectedCategory = DEFAULT_CATEGORY.name;
  const [inputValue, setInputValue] = useState('');
  const [activeSession, setActiveSession] = useState<string | null>('new');
  const [messages, setMessages] = useState<ConvMessage[]>([]);
  const [genState, setGenState] = useState<GenState>('idle');
  const [patterns, setPatterns] = useState<GeneratedPattern[]>([]);
  const [zoomPattern, setZoomPattern] = useState<GeneratedPattern | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionAnim, setNewSessionAnim] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [attachments, setAttachments] = useState<InputAttachment[]>([]);
  const [taskEventLog, setTaskEventLog] = useState<TaskEventLogItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI 任务相关状态
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [assistantMsgId, setAssistantMsgId] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<RuntimeState>(INITIAL_RUNTIME_STATE);
  const sseRef = useRef<{ close: () => void } | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const runtimeRef = useRef<RuntimeState>(INITIAL_RUNTIME_STATE);
  const patternsRef = useRef<GeneratedPattern[]>([]);
  const sessionLoadVersionRef = useRef(0);
  const lastEventIdRef = useRef<string | null>(null);
  const assistantMsgIdRef = useRef<string | null>(null);

  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  useEffect(() => { lastEventIdRef.current = lastEventId; }, [lastEventId]);
  useEffect(() => { assistantMsgIdRef.current = assistantMsgId; }, [assistantMsgId]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);

  // 真实图片读取路径
  const getImageUrl = (fileId?: string): string =>
    fileId ? `/api/client/file/content/${encodeURIComponent(fileId)}` : '';

  const updateLastEventId = (value: string | null) => {
    setLastEventId(value);
    lastEventIdRef.current = value;
  };

  const updateCurrentTaskId = (value: string | null) => {
    currentTaskIdRef.current = value;
    setCurrentTaskId(value);
  };

  const updateCurrentSessionId = (value: string | null) => {
    currentSessionIdRef.current = value;
    setCurrentSessionId(value);
  };

  const updateAssistantMessageId = (value: string | null) => {
    assistantMsgIdRef.current = value;
    setAssistantMsgId(value);
  };

  const readPersistedTask = useCallback((sessionId: string | null) => {
    if (!sessionId) return null;
    return readPersistedTaskMap()[sessionId] || null;
  }, []);

  const upsertPersistedTask = useCallback((
    sessionId: string | null,
    patch: Partial<PersistedTaskRecord> & { taskId?: string | null }
  ) => {
    if (!sessionId) return;

    const taskMap = readPersistedTaskMap();
    const prev = taskMap[sessionId];
    const nextTaskId = patch.taskId?.trim() || prev?.taskId?.trim() || '';
    if (!nextTaskId) return;

    taskMap[sessionId] = {
      sessionId,
      taskId: nextTaskId,
      assistantMessageId: patch.assistantMessageId ?? prev?.assistantMessageId ?? null,
      lastEventId: patch.lastEventId ?? prev?.lastEventId ?? null,
      status: patch.status ?? prev?.status ?? null,
      phase: patch.phase ?? prev?.phase ?? null,
      queuePosition: patch.queuePosition ?? prev?.queuePosition ?? null,
      estimatedWaitMs: patch.estimatedWaitMs ?? prev?.estimatedWaitMs ?? null,
      requestId: patch.requestId ?? prev?.requestId ?? null,
      patterns: patch.patterns ?? prev?.patterns ?? [],
      updatedAt: Date.now(),
    };

    writePersistedTaskMap(taskMap);
  }, []);

  const clearPersistedTask = useCallback((sessionId: string | null) => {
    if (!sessionId) return;
    const taskMap = readPersistedTaskMap();
    if (!taskMap[sessionId]) return;
    delete taskMap[sessionId];
    writePersistedTaskMap(taskMap);
  }, []);

  const resetRuntime = () => {
    runtimeRef.current = INITIAL_RUNTIME_STATE;
    setRuntime(INITIAL_RUNTIME_STATE);
  };

  const patchRuntime = (patch: Partial<RuntimeState>) => {
    setRuntime(prev => {
      const next = { ...prev, ...patch };
      runtimeRef.current = next;
      return next;
    });
  };

  const clearTaskEventLog = () => {
    setTaskEventLog([]);
  };

  const pushTaskEvent = useCallback((
    entry: Omit<TaskEventLogItem, 'id' | 'occurredAt'> & { occurredAt?: number }
  ) => {
    const nextEntry: TaskEventLogItem = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      occurredAt: entry.occurredAt ?? Date.now(),
    };

    setTaskEventLog(prev => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.kind === nextEntry.kind &&
        last.title === nextEntry.title &&
        last.detail === nextEntry.detail &&
        last.eventType === nextEntry.eventType &&
        last.connectionState === nextEntry.connectionState
      ) {
        return [
          ...prev.slice(0, -1),
          { ...last, occurredAt: nextEntry.occurredAt },
        ];
      }

      return [...prev, nextEntry].slice(-TASK_EVENT_LOG_LIMIT);
    });
  }, []);

  useEffect(() => {
    if (!currentSessionId || !currentTaskId) {
      return;
    }

    upsertPersistedTask(currentSessionId, {
      taskId: currentTaskId,
      assistantMessageId: assistantMsgId,
      lastEventId,
      status: runtime.status,
      phase: runtime.phase,
      queuePosition: runtime.queuePosition,
      estimatedWaitMs: runtime.estimatedWaitMs,
      requestId: runtime.requestId,
      patterns,
    });
  }, [
    assistantMsgId,
    currentSessionId,
    currentTaskId,
    lastEventId,
    patterns,
    runtime.estimatedWaitMs,
    runtime.phase,
    runtime.queuePosition,
    runtime.requestId,
    runtime.status,
    upsertPersistedTask,
  ]);

  const normalizePatternTags = (tags?: string[], fallbackTag?: string) => {
    const merged = [...(tags || []), ...(fallbackTag ? [fallbackTag] : [])].filter(Boolean);
    return Array.from(new Set(merged));
  };

  const normalizeConversationRole = (role?: string): 'user' | 'system' =>
    role === 'user' ? 'user' : 'system';

  const normalizeSseImages = (images?: SSEImageInfo[]): ConversationImage[] => {
    if (!Array.isArray(images)) return [];
    return images
      .map((image): ConversationImage | null => {
        const fileId = image?.fileId;
        if (!fileId) {
          return null;
        }
        return {
          recordId: image.recordId,
          fileId,
          title: image.title,
          description: image.description,
          tags: image.tags,
          width: image.width,
          height: image.height,
        } satisfies ConversationImage;
      })
      .filter((image): image is ConversationImage => image !== null);
  };

  const mergeConversationImages = (
    base: ConversationImage[] | undefined,
    incoming: ConversationImage[]
  ) => {
    if (incoming.length === 0) {
      return base;
    }

    const next = [...(base || [])];
    incoming.forEach(image => {
      const matchIndex = next.findIndex(existing =>
        (image.recordId && existing.recordId === image.recordId) ||
        (image.fileId && existing.fileId === image.fileId)
      );

      if (matchIndex >= 0) {
        next[matchIndex] = {
          ...next[matchIndex],
          ...image,
        };
      } else {
        next.push(image);
      }
    });

    return next;
  };

  const formatTaskStatus = (status?: string | null) =>
    status ? TASK_STATUS_LABELS[status] || status : '';

  const formatTaskPhase = (phase?: string | null) =>
    phase ? TASK_PHASE_LABELS[phase] || phase : '';

  const formatTaskEvent = (eventType?: string | null) =>
    eventType ? TASK_EVENT_LABELS[eventType] || eventType : '';

  const formatConnectionState = (state?: SSEConnectionState | null, message?: string | null) => {
    if (!state) return '';
    return message ? `${CONNECTION_STATE_LABELS[state]} · ${message}` : CONNECTION_STATE_LABELS[state];
  };

  const formatEventCursor = (cursor?: string | null) => {
    if (!cursor) return '';
    return cursor.length > 20
      ? `${cursor.slice(0, 8)}...${cursor.slice(-8)}`
      : cursor;
  };

  const formatEstimatedWait = (estimatedWaitMs?: number | null) => {
    if (estimatedWaitMs == null) return '';
    if (estimatedWaitMs < 1000) return `${estimatedWaitMs} ms`;
    if (estimatedWaitMs < 60000) return `${Math.ceil(estimatedWaitMs / 1000)} 秒`;
    return `${Math.ceil(estimatedWaitMs / 60000)} 分钟`;
  };

  const formatEventLogTime = (time: number) =>
    new Date(time).toLocaleTimeString('zh', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const describeTaskEvent = (msg: SSEMessage) => {
    switch (msg.type) {
      case 'heartbeat':
        return null;
      case 'message.delta':
        if (runtimeRef.current.lastEventType === 'message.delta') {
          return null;
        }
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: '正在持续回传文本内容',
        };
      case 'queue.updated': {
        const detail = [
          msg.position != null ? `前方 ${msg.position} 个任务` : null,
          msg.estimatedWaitMs != null ? `预计 ${formatEstimatedWait(msg.estimatedWaitMs)}` : null,
        ].filter((item): item is string => Boolean(item)).join(' · ');
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: detail || '任务已进入调度队列',
        };
      }
      case 'task.phase':
        return {
          title: formatTaskPhase(msg.phase) || TASK_EVENT_LABELS[msg.type],
          detail: msg.requestId ? `请求编号 ${msg.requestId}` : undefined,
        };
      case 'message.completed':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: msg.finishReason ? `结束原因：${msg.finishReason}` : '文本输出已结束',
        };
      case 'artifact.pending': {
        const pendingCount = Array.from(
          new Set([
            ...(msg.recordIds || []),
            msg.recordId,
          ].filter((value): value is string => Boolean(value)))
        ).length;
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: pendingCount > 0
            ? `已提交 ${pendingCount} 个图片生成记录`
            : msg.promptSummary || '等待图片服务回调',
        };
      }
      case 'artifact.ready': {
        const imageCount = [
          ...(msg.image ? [msg.image] : []),
          ...(Array.isArray(msg.images) ? msg.images : []),
        ].length;
        const fileCount = Array.from(
          new Set(
            (Array.isArray(msg.fileIds) && msg.fileIds.length > 0
              ? msg.fileIds
              : msg.fileId
                ? [msg.fileId]
                : []
            ).filter((value): value is string => Boolean(value))
          )
        ).length;
        const count = Math.max(msg.totalCount || 0, imageCount, fileCount);
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: count > 0 ? `已返回 ${count} 张图片` : '图片结果已可查看',
        };
      }
      case 'artifact.failed':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: msg.message || msg.errorMessage || msg.code || '图片生成未成功',
        };
      case 'artifact.metadata.completed':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: '图片元数据已补齐',
        };
      case 'task.completed':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: '本轮创作已完成',
        };
      case 'task.failed':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: msg.message || msg.errorMessage || '任务执行失败',
        };
      case 'task.rejected':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: msg.displayText || '内容审核未通过',
        };
      case 'task.cancelled':
        return {
          title: TASK_EVENT_LABELS[msg.type],
          detail: msg.reason || '任务已取消',
        };
      default:
        return null;
    }
  };

  const describeConnectionEvent = (event: SSEConnectionEvent) => {
    const detail = [
      event.message || null,
      event.retryInMs != null ? `${Math.ceil(event.retryInMs / 1000)} 秒后继续` : null,
      event.lastEventId ? `游标 ${formatEventCursor(event.lastEventId)}` : null,
      event.state === 'connected' && event.attempt > 1 ? '已恢复续传' : null,
    ].filter((item): item is string => Boolean(item)).join(' · ');

    return {
      title: CONNECTION_STATE_LABELS[event.state],
      detail: detail || undefined,
    };
  };

  const buildPatternFromImage = (
    image: ConversationImage,
    options: {
      taskId?: string;
      title?: string;
      desc?: string;
      tags?: string[];
      fileIdFallback?: string;
      requestId?: string;
      recordId?: string;
    } = {}
  ): GeneratedPattern | null => {
    const fileId = image.fileId || options.fileIdFallback || '';
    if (!fileId) return null;
    const recordId = image.recordId || options.recordId;
    const requestId = options.requestId;
    return {
      id: recordId || (requestId ? `${requestId}:${fileId}` : fileId),
      status: 'ready',
      taskId: options.taskId,
      requestId,
      recordId,
      fileId: fileId || undefined,
      title: image.title || options.title || '生成纹样',
      desc: image.description || options.desc || '',
      tags: normalizePatternTags([...(image.tags || []), ...(options.tags || [])], selectedCategory),
      style: image.tags?.[0] || 'AI生成',
      scene: image.description || options.desc || '智绘创作',
      imageUrl: getImageUrl(fileId || undefined),
    };
  };

  const buildPatternFromFileId = (
    fileId: string,
    options: { taskId?: string; title?: string; desc?: string; tags?: string[]; requestId?: string; recordId?: string } = {}
  ): GeneratedPattern => ({
    id: options.recordId || (options.requestId ? `${options.requestId}:${fileId}` : fileId),
    status: 'ready',
    taskId: options.taskId,
    requestId: options.requestId,
    recordId: options.recordId,
    fileId,
    title: options.title || '生成纹样',
    desc: options.desc || '',
    tags: normalizePatternTags(options.tags, selectedCategory),
    style: 'AI生成',
    scene: options.desc || '智绘创作',
    imageUrl: getImageUrl(fileId),
  });

  const buildPendingPattern = (
    requestId: string,
    options: { taskId?: string; title?: string; desc?: string; tags?: string[]; recordId?: string } = {}
  ): GeneratedPattern => ({
    id: options.recordId || requestId,
    status: 'pending',
    taskId: options.taskId,
    requestId,
    recordId: options.recordId,
    title: options.title || '纹样生成中',
    desc: options.desc || '图片正在生成，完成后会自动替换为成图',
    tags: normalizePatternTags(options.tags, selectedCategory),
    style: '生成中',
    scene: '等待回调',
    imageUrl: '',
  });

  const buildFailedPattern = (
    requestId: string,
    options: {
      taskId?: string;
      title?: string;
      desc?: string;
      tags?: string[];
      recordId?: string;
      errorCode?: string;
      errorMessage?: string;
      retriable?: boolean;
    } = {}
  ): GeneratedPattern => ({
    id: options.recordId || requestId,
    status: 'failed',
    taskId: options.taskId,
    requestId,
    recordId: options.recordId,
    title: options.title || '纹样生成失败',
    desc: options.desc || '图片生成未成功，可重新发起生成。',
    tags: normalizePatternTags(options.tags, selectedCategory),
    style: '生成失败',
    scene: '等待重试',
    imageUrl: '',
    errorCode: options.errorCode,
    errorMessage: options.errorMessage,
    retriable: options.retriable,
  });

  const getPatternAliases = (
    pattern: Pick<GeneratedPattern, 'id' | 'recordId' | 'fileId'>
  ) =>
    [pattern.id, pattern.recordId, pattern.fileId].filter(
      (value): value is string => Boolean(value)
    );

  const hasConcretePatternIdentity = (
    pattern: Pick<GeneratedPattern, 'recordId' | 'fileId'>
  ) => Boolean(pattern.recordId || pattern.fileId);

  const mergePatternCollections = (base: GeneratedPattern[], incoming: GeneratedPattern[]) => {
    if (incoming.length === 0) return base;
    const next = [...base];
    incoming.forEach(item => {
      const itemAliases = getPatternAliases(item);
      const matchIndex = next.findIndex(existing => {
        const existingAliases = getPatternAliases(existing);
        if (itemAliases.some(alias => existingAliases.includes(alias))) {
          return true;
        }
        if (item.requestId && existing.requestId === item.requestId) {
          const existingIsGeneric = !hasConcretePatternIdentity(existing);
          const incomingIsGeneric = !hasConcretePatternIdentity(item);
          return existingIsGeneric || incomingIsGeneric;
        }
        return false;
      });

      if (matchIndex >= 0) {
        const existing = next[matchIndex];
        next[matchIndex] = {
          ...existing,
          ...item,
          id: existing.id || item.id,
          requestId: existing.requestId || item.requestId,
          recordId: existing.recordId || item.recordId,
          fileId: existing.fileId || item.fileId,
        };
        return;
      }

      next.push(item);
    });
    return next;
  };

  const mergePatterns = (incoming: GeneratedPattern[]) => {
    if (incoming.length === 0) return;
    setPatterns(prev => mergePatternCollections(prev, incoming));
  };

  const mapLifecycleState = (payload: {
    status?: string | null;
    phase?: string | null;
    eventType?: string | null;
    messageType?: string | null;
  }): GenState => {
    const tokens = [payload.status, payload.phase, payload.eventType, payload.messageType]
      .filter((item): item is string => Boolean(item))
      .map(item => item.toUpperCase());

    if (tokens.includes('CANCEL_REQUESTED')) return 'cancelRequested';

    const terminalHit = tokens.find(token => ['FAILED', 'INTERRUPTED', 'REJECTED', 'CANCELLED', 'CANCELED', 'COMPLETED', 'DONE', 'SUCCESS', 'SUCCEEDED'].includes(token));
    if (terminalHit) {
      if (['FAILED'].includes(terminalHit)) return 'failed';
      if (['INTERRUPTED'].includes(terminalHit)) return 'interrupted';
      if (['REJECTED'].includes(terminalHit)) return 'rejected';
      if (['CANCELLED', 'CANCELED'].includes(terminalHit)) return 'cancelled';
      return 'done';
    }

    if (tokens.includes('QUEUED') || tokens.includes('QUEUE.UPDATED')) return 'queued';
    if (tokens.includes('INPUT_REVIEW')) return 'inputReview';
    if (tokens.includes('PLANNING')) return 'planning';
    if (tokens.includes('PROMPT_REWRITE')) return 'promptRewrite';
    if (tokens.includes('IMAGE_SUBMIT')) return 'imageSubmit';
    if (tokens.includes('IMAGE_WAIT_CALLBACK')) return 'imageWaitCallback';
    if (tokens.includes('FINALIZING')) return 'finalizing';
    if (tokens.includes('TEXT_GENERATING') || tokens.includes('MESSAGE.DELTA')) return 'textGenerating';
    if (tokens.includes('ARTIFACT.READY')) return 'finalizing';
    if (tokens.includes('ARTIFACT.METADATA.COMPLETED')) return 'finalizing';
    if (tokens.includes('MESSAGE.COMPLETED')) return 'finalizing';
    return 'planning';
  };

  const isTerminalState = (state: GenState) => TERMINAL_TASK_STATES.has(state);

  const buildAssistantPlaceholderMessage = (
    messageId: string,
    options: { taskId?: string | null; timestamp?: string | number | Date | null } = {}
  ): ConvMessage => ({
    id: messageId,
    role: 'system',
    content: '',
    timestamp: formatMessageTime(options.timestamp),
    taskId: options.taskId || undefined,
    assistantMessageId: messageId,
  });

  const normalizeMessageId = (messageId?: string | null) => {
    const normalized = messageId?.trim();
    return normalized ? normalized : null;
  };

  const ensureAssistantMessageBinding = (
    messageId: string | null,
    fallbackId: string | null,
    options: { taskId?: string | null; timestamp?: string | number | Date | null } = {}
  ) => {
    const canonicalId = normalizeMessageId(messageId);
    const localFallbackId = normalizeMessageId(fallbackId);
    const targetId = canonicalId || localFallbackId;

    if (!targetId) {
      return null;
    }

    setMessages(prev => {
      const canonicalIndex = canonicalId
        ? prev.findIndex(message => message.id === canonicalId)
        : -1;
      const fallbackIndex = localFallbackId && localFallbackId !== canonicalId
        ? prev.findIndex(message => message.id === localFallbackId)
        : -1;

      if (canonicalIndex === -1 && fallbackIndex === -1) {
        if (!canonicalId) {
          return prev;
        }
        return [...prev, buildAssistantPlaceholderMessage(canonicalId, options)];
      }

      if (!canonicalId || fallbackIndex === -1 || canonicalId === localFallbackId) {
        return prev;
      }

      const canonicalMessage = canonicalIndex >= 0 ? prev[canonicalIndex] : null;
      const fallbackMessage = prev[fallbackIndex];
      const mergedMessage: ConvMessage = canonicalMessage
        ? {
            ...fallbackMessage,
            ...canonicalMessage,
            id: canonicalId,
            role: 'system',
            content: canonicalMessage.content || fallbackMessage.content,
            timestamp: canonicalMessage.timestamp || fallbackMessage.timestamp,
            taskId: canonicalMessage.taskId || fallbackMessage.taskId || options.taskId || undefined,
            assistantMessageId: canonicalId,
            images: mergeConversationImages(fallbackMessage.images, canonicalMessage.images || []),
          }
        : {
            ...fallbackMessage,
            id: canonicalId,
            role: 'system',
            timestamp: fallbackMessage.timestamp || formatMessageTime(options.timestamp),
            taskId: fallbackMessage.taskId || options.taskId || undefined,
            assistantMessageId: canonicalId,
          };

      const removeIds = new Set([canonicalId, localFallbackId]);
      const targetIndex = canonicalIndex >= 0 ? canonicalIndex : fallbackIndex;
      const removedBeforeTarget = [canonicalIndex, fallbackIndex]
        .filter((index): index is number => index >= 0 && index < targetIndex)
        .length;
      const nextMessages = prev.filter(message => !removeIds.has(message.id));
      nextMessages.splice(targetIndex - removedBeforeTarget, 0, mergedMessage);
      return nextMessages;
    });

    if (canonicalId && assistantMsgIdRef.current !== canonicalId) {
      updateAssistantMessageId(canonicalId);
    }

    return targetId;
  };

  const upsertAssistantMessage = (
    messageId: string | null,
    updater: (message: ConvMessage) => ConvMessage,
    options: { taskId?: string | null; timestamp?: string | number | Date | null } = {}
  ) => {
    if (!messageId) return;
    setMessages(prev => {
      const matchIndex = prev.findIndex(message => message.id === messageId);
      if (matchIndex === -1) {
        return [...prev, updater(buildAssistantPlaceholderMessage(messageId, options))];
      }

      return prev.map(message =>
        message.id === messageId ? updater(message) : message
      );
    });
  };

  const applyAssistantText = (
    messageId: string | null,
    nextText: string,
    options: { taskId?: string | null; timestamp?: string | number | Date | null } = {}
  ) => {
    upsertAssistantMessage(
      messageId,
      message => ({ ...message, content: nextText }),
      options
    );
  };

  const patchAssistantMessage = (
    messageId: string | null,
    updater: (message: ConvMessage) => ConvMessage,
    options: { taskId?: string | null; timestamp?: string | number | Date | null } = {}
  ) => {
    upsertAssistantMessage(messageId, updater, options);
  };

  const extractPatternsFromImages = (
    images: ConversationImage[] | undefined,
    options: { taskId?: string; title?: string; desc?: string; requestId?: string; recordId?: string; tags?: string[] } = {}
  ): GeneratedPattern[] => {
    if (!images || images.length === 0) return [];
    return images
      .map(image => buildPatternFromImage(image, options))
      .filter((item): item is GeneratedPattern => Boolean(item));
  };

  const extractPatternsFromConversation = (conversation: ConvMessage[]) => {
    const nextPatterns: GeneratedPattern[] = [];
    conversation.forEach(message => {
      if (message.role === 'user') return;

      const requestId = message.requestId || message.taskId || message.artifact?.requestId;
      const artifactRecordIds = (message.artifact?.records || [])
        .map(record => record.recordId)
        .filter((value): value is string => Boolean(value));
      const recordId = message.recordId || artifactRecordIds[0];
      const recordIds = Array.from(
        new Set([
          ...(message.recordIds || []),
          ...artifactRecordIds,
        ].filter((value): value is string => Boolean(value)))
      );
      const fileIds = Array.from(
        new Set([
          ...(message.images?.map(image => image.fileId) || []),
          message.artifact?.fileId,
          ...(message.artifact?.fileIds || []),
          ...((message.artifact?.records || []).map(record => record.fileId)),
        ].filter((value): value is string => Boolean(value)))
      );
      const title = message.content || message.artifact?.promptSummary || '生成纹样';
      const desc = message.artifact?.promptSummary || message.content || '';
      const tags = message.category ? [message.category] : [selectedCategory];
      const artifactStatus = normalizeArtifactStatus(message.artifact?.status || message.artifactStatus || message.status);

      if (message.images?.length) {
        nextPatterns.push(
          ...extractPatternsFromImages(message.images, {
            taskId: message.taskId,
            title,
            desc,
            requestId: requestId || undefined,
            recordId: recordId || undefined,
            tags,
          })
        );
      }

      if (artifactStatus === 'ready') {
        if ((!message.images || message.images.length === 0) && fileIds.length > 0) {
          nextPatterns.push(
            ...fileIds.map(fileId => buildPatternFromFileId(fileId, {
              taskId: message.taskId,
              title,
              desc,
              requestId: requestId || undefined,
              recordId: fileIds.length === 1 ? recordId || undefined : undefined,
              tags,
            }))
          );
        }
      }

      if (artifactStatus === 'pending') {
        const pendingRecordIds = recordIds.length > 0 ? recordIds : requestId ? [requestId] : [];
        nextPatterns.push(
          ...pendingRecordIds.map(itemId => buildPendingPattern(requestId || itemId, {
            taskId: message.taskId,
            title,
            desc: desc || '图片正在生成，完成后会自动替换为成图',
            tags,
            recordId: requestId && itemId === requestId ? undefined : itemId,
          }))
        );
      }

      if (artifactStatus === 'failed') {
        const failedRecordIds = recordIds.length > 0 ? recordIds : recordId ? [recordId] : [];
        nextPatterns.push(
          ...failedRecordIds.map(itemId => buildFailedPattern(requestId || itemId, {
            taskId: message.taskId,
            title,
            desc: desc || '图片生成未成功，可重新发起生成。',
            tags,
            recordId: requestId && itemId === requestId ? undefined : itemId,
          }))
        );
      }
    });
    return nextPatterns;
  };

  const getPatternsForMessage = (message: ConvMessage) => {
    if (message.role !== 'system') {
      return [];
    }

    const persistedPatterns = extractPatternsFromConversation([message]);
    if (!message.taskId) {
      return persistedPatterns;
    }

    const runtimePatterns = patterns.filter(pattern => pattern.taskId === message.taskId);
    return mergePatternCollections(persistedPatterns, runtimePatterns);
  };

  const resolveLatestAssistantMessageId = (
    conversation: ConvMessage[],
    taskId?: string | null
  ) => {
    for (let index = conversation.length - 1; index >= 0; index -= 1) {
      const message = conversation[index];
      if (message.role !== 'system') {
        continue;
      }
      if (taskId && message.taskId !== taskId) {
        continue;
      }
      return message.id;
    }
    return null;
  };

  const buildRegeneratePrompt = (pattern: GeneratedPattern) => {
    return [
      `请基于以下方向重新生成一组相近但有差异的${selectedCategory}纹样：`,
      `方向标题：${pattern.title}`,
      pattern.desc ? `方向说明：${pattern.desc}` : null,
      pattern.tags.length > 0 ? `关键词：${pattern.tags.join('、')}` : null,
      '请保留核心气质，但调整构图、局部细节和节奏变化。',
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n');
  };

  // 断线恢复时先拉一次任务快照，用它补齐文本、运行态和已落库的图片资源。
  // 这里必须校验 taskId 仍然是当前任务，避免旧请求在切会话后回写页面。
  const syncTaskSnapshot = async (taskId: string, assistantIdHint?: string | null) => {
    const res = await chatService.getTaskSnapshot(taskId);
    if (currentTaskIdRef.current !== taskId) {
      return null;
    }

    const snapshot = res.data;
    const snapshotState = mapLifecycleState({
      status: snapshot.status,
      phase: snapshot.phase,
    });

    if (snapshot.lastEventId) {
      updateLastEventId(snapshot.lastEventId);
    }

    const targetAssistantId = ensureAssistantMessageBinding(
      snapshot.assistantMessageId || null,
      assistantMsgIdRef.current || assistantIdHint || null,
      {
        taskId: snapshot.taskId,
        timestamp: Date.now(),
      }
    ) || snapshot.assistantMessageId || assistantMsgIdRef.current || assistantIdHint || null;
    const nextAssistantText = snapshot.assistantText || snapshot.artifact?.promptSummary || '';
    if (nextAssistantText) {
      applyAssistantText(targetAssistantId, nextAssistantText, {
        taskId: snapshot.taskId,
        timestamp: Date.now(),
      });
    }

    patchRuntime({
      status: snapshot.status ?? null,
      phase: snapshot.phase ?? null,
      queuePosition: snapshot.queuePosition ?? null,
      estimatedWaitMs: snapshot.estimatedWaitMs ?? null,
      requestId: snapshot.artifact?.requestId ?? null,
    });

    upsertPersistedTask(snapshot.sessionId || currentSessionIdRef.current, {
      taskId: snapshot.taskId || taskId,
      assistantMessageId: snapshot.assistantMessageId || targetAssistantId,
      lastEventId: snapshot.lastEventId || lastEventIdRef.current,
      status: snapshot.status ?? null,
      phase: snapshot.phase ?? null,
      queuePosition: snapshot.queuePosition ?? null,
      estimatedWaitMs: snapshot.estimatedWaitMs ?? null,
      requestId: snapshot.artifact?.requestId ?? null,
    });

    if (snapshot.artifact) {
      const artifact = snapshot.artifact;
      const requestId = artifact.requestId || snapshot.taskId;
      const artifactStatus = normalizeArtifactStatus(artifact.status);
      const artifactRecords = artifact.records || [];
      const artifactRecordIds = Array.from(
        new Set([
          ...artifactRecords.map(record => record.recordId),
        ].filter((value): value is string => Boolean(value)))
      );
      const artifactFileIds = Array.from(
        new Set(
          [
            artifact.fileId,
            ...(artifact.fileIds || []),
            ...artifactRecords.map(record => record.fileId),
          ].filter(
            (fileId): fileId is string => Boolean(fileId)
          )
        )
      );
      const recordImagePatterns = extractPatternsFromImages(
        artifactRecords.map(record => ({
          recordId: record.recordId,
          fileId: record.fileId,
          title: record.title,
          description: record.description,
          tags: record.tags,
          width: record.width,
          height: record.height,
        })),
        {
          taskId: snapshot.taskId,
          title: artifact.promptSummary || nextAssistantText || '生成纹样',
          desc: artifact.promptSummary || nextAssistantText || '',
          tags: [selectedCategory],
          requestId,
        }
      );

      const snapshotImages = normalizeSseImages(
        artifactRecords.map(record => ({
          recordId: record.recordId,
          fileId: record.fileId,
          title: record.title,
          description: record.description,
          tags: record.tags,
          width: record.width,
          height: record.height,
        }))
      );

      patchAssistantMessage(
        targetAssistantId,
        message => ({
          ...message,
          requestId,
          recordId: artifactRecords[0]?.recordId || message.recordId,
          recordIds: artifactRecordIds.length > 0 ? artifactRecordIds : message.recordIds,
          artifactStatus: artifact.status,
          images: mergeConversationImages(message.images, snapshotImages),
        }),
        { taskId: snapshot.taskId }
      );

      if (artifactStatus === 'ready') {
        const readyPatterns = [
          ...recordImagePatterns,
          ...(recordImagePatterns.length === 0
            ? artifactFileIds.map(fileId =>
                buildPatternFromFileId(fileId, {
                  taskId: snapshot.taskId,
                  title: artifact.promptSummary || nextAssistantText || '生成纹样',
                  desc: artifact.promptSummary || nextAssistantText || '',
                  tags: [selectedCategory],
                  requestId,
                  recordId: artifactFileIds.length === 1 ? artifactRecords[0]?.recordId : undefined,
                })
              )
            : []),
        ];
        if (readyPatterns.length > 0) {
          mergePatterns(readyPatterns);
        }
      } else if (artifactStatus === 'pending') {
        const pendingIds = artifactRecordIds.length > 0
          ? artifactRecordIds
          : requestId
            ? [requestId]
            : [];
        mergePatterns(
          pendingIds.map(itemId =>
            buildPendingPattern(requestId || itemId, {
              taskId: snapshot.taskId,
              title: artifact.promptSummary || nextAssistantText || '纹样生成中',
              desc: artifact.promptSummary || nextAssistantText || '图片正在生成，完成后会自动替换为成图',
              tags: [selectedCategory],
              recordId: requestId && itemId === requestId ? undefined : itemId,
            })
          )
        );
      } else if (artifactStatus === 'failed') {
        const failedIds = artifactRecordIds.length > 0
          ? artifactRecordIds
          : requestId
            ? [requestId]
            : [];
        mergePatterns(
          failedIds.map(itemId =>
            buildFailedPattern(requestId || itemId, {
              taskId: snapshot.taskId,
              title: artifact.promptSummary || nextAssistantText || '纹样生成失败',
              desc: artifact.promptSummary || nextAssistantText || '图片生成未成功，可重新发起生成。',
              tags: [selectedCategory],
              recordId: requestId && itemId === requestId ? undefined : itemId,
              errorCode: snapshot.error?.code,
              errorMessage: snapshot.error?.message,
              retriable: snapshot.error?.retriable,
            })
          )
        );
      }
    }

    setGenState(snapshotState);
    return { snapshot, snapshotState, targetAssistantId };
  };

  const updateTaskFromMessage = (msg: SSEMessage, assistantId: string) => {
    if (currentTaskIdRef.current !== msg.taskId) {
      return;
    }
    if (msg.sessionId && currentSessionIdRef.current && msg.sessionId !== currentSessionIdRef.current) {
      return;
    }

    const targetAssistantId = ensureAssistantMessageBinding(
      msg.messageId || null,
      assistantMsgIdRef.current || assistantId || null,
      {
        taskId: msg.taskId,
        timestamp: msg.occurredAt,
      }
    ) || msg.messageId || assistantMsgIdRef.current || assistantId || null;

    const previousRuntime = runtimeRef.current;
    const streamCursor = msg.id || msg.streamId || null;
    if (streamCursor) {
      updateLastEventId(streamCursor);
    }

    const runtimePatch: Partial<RuntimeState> = {
      lastEventType: msg.type,
    };
    if (msg.phase) runtimePatch.phase = msg.phase;
    if ('position' in msg) runtimePatch.queuePosition = msg.position ?? null;
    if ('estimatedWaitMs' in msg) runtimePatch.estimatedWaitMs = msg.estimatedWaitMs ?? null;
    if (msg.requestId) runtimePatch.requestId = msg.requestId;
    if (msg.serviceType) runtimePatch.serviceType = msg.serviceType;
    if (msg.remoteTaskId) runtimePatch.remoteTaskId = msg.remoteTaskId;

    switch (msg.type) {
      case 'queue.updated':
        runtimePatch.status = 'PENDING';
        break;
      case 'task.phase':
      case 'message.delta':
      case 'message.completed':
      case 'artifact.pending':
      case 'artifact.ready':
      case 'artifact.failed':
      case 'artifact.metadata.completed':
        runtimePatch.status = previousRuntime.status === 'CANCEL_REQUESTED' ? 'CANCEL_REQUESTED' : 'RUNNING';
        break;
      case 'task.completed':
        runtimePatch.status = 'COMPLETED';
        break;
      case 'task.failed':
        runtimePatch.status = 'FAILED';
        break;
      case 'heartbeat':
        runtimePatch.status = previousRuntime.status;
        break;
      case 'task.rejected':
        runtimePatch.status = 'REJECTED';
        break;
      case 'task.cancelled':
        runtimePatch.status = 'CANCELLED';
        break;
    }

    const eventSummary = describeTaskEvent(msg);
    if (eventSummary) {
      const eventTime = msg.occurredAt ? Date.parse(msg.occurredAt) : NaN;
      pushTaskEvent({
        kind: 'event',
        title: eventSummary.title,
        detail: eventSummary.detail,
        eventType: msg.type,
        occurredAt: Number.isNaN(eventTime) ? Date.now() : eventTime,
      });
    }

    patchRuntime(runtimePatch);
    patchAssistantMessage(
      targetAssistantId,
      message => ({
        ...message,
        taskId: msg.taskId || message.taskId,
        assistantMessageId: targetAssistantId || message.assistantMessageId,
        lastEventId: streamCursor || message.lastEventId,
        lastEventSeq: typeof msg.seq === 'number' ? msg.seq : message.lastEventSeq,
        status: runtimePatch.status || message.status,
        phase: msg.phase || runtimePatch.phase || message.phase,
        requestId: msg.requestId || message.requestId,
      }),
      { taskId: msg.taskId, timestamp: msg.occurredAt }
    );

    const lifecycleState = mapLifecycleState({
      status: runtimePatch.status || previousRuntime.status,
      phase: msg.phase,
      eventType: msg.type,
    });
    if (lifecycleState !== 'planning' || msg.type === 'queue.updated') {
      setGenState(lifecycleState);
    }

    switch (msg.type) {
      case 'queue.updated':
        setGenState('queued');
        break;
      case 'task.phase':
        setGenState(mapLifecycleState({
          status: runtimePatch.status || previousRuntime.status,
          phase: msg.phase,
          eventType: msg.type,
        }));
        break;
      case 'message.delta':
        setGenState('textGenerating');
        patchAssistantMessage(
          targetAssistantId,
          message => ({
            ...message,
            content: `${message.content || ''}${msg.delta || ''}`,
          }),
          { taskId: msg.taskId, timestamp: msg.occurredAt }
        );
        break;
      case 'message.completed':
        setGenState('finalizing');
        break;
      case 'artifact.pending':
        setGenState('imageWaitCallback');
        patchRuntime({ phase: 'IMAGE_WAIT_CALLBACK' });
        {
          const requestId = msg.requestId || msg.taskId;
          const pendingRecordIds = Array.from(
            new Set([
              ...(msg.recordIds || []),
              msg.recordId,
            ].filter((value): value is string => Boolean(value)))
          );

          mergePatterns(
            (pendingRecordIds.length > 0 ? pendingRecordIds : [requestId]).map(itemId =>
              buildPendingPattern(requestId, {
                taskId: msg.taskId,
                title: msg.promptSummary || '纹样生成中',
                desc: msg.promptSummary || '图片正在生成，完成后会自动替换为成图',
                tags: [selectedCategory],
                recordId: itemId === requestId ? msg.recordId : itemId,
              })
            )
          );

          patchAssistantMessage(
            targetAssistantId,
            message => ({
              ...message,
              requestId,
              recordId: msg.recordId || message.recordId,
              recordIds: pendingRecordIds.length > 0 ? pendingRecordIds : message.recordIds,
              artifactStatus: 'PENDING',
            }),
            { taskId: msg.taskId, timestamp: msg.occurredAt }
          );
        }
        break;
      case 'artifact.ready': {
        const mergedImages = [
          ...(msg.image ? [msg.image] : []),
          ...(Array.isArray(msg.images) ? msg.images : []),
        ];
        const artifactImages = normalizeSseImages(mergedImages);
        const requestId = msg.requestId || msg.taskId;
        const imagePatterns = artifactImages.length > 0
          ? extractPatternsFromImages(artifactImages, {
              taskId: msg.taskId,
              title: msg.promptSummary || '生成纹样',
              desc: msg.promptSummary || '',
              tags: [selectedCategory],
              requestId,
              recordId: msg.recordId,
            })
          : [];

        const fileIds = Array.from(
          new Set(
            (Array.isArray(msg.fileIds) && msg.fileIds.length > 0
              ? msg.fileIds
              : msg.fileId
                ? [msg.fileId]
                : []
            ).filter((fileId): fileId is string => Boolean(fileId))
          )
        );

        const filePatterns = artifactImages.length === 0
          ? fileIds.map(fileId =>
              buildPatternFromFileId(fileId, {
                taskId: msg.taskId,
                title: msg.promptSummary || '生成纹样',
                desc: msg.promptSummary || '',
                tags: [selectedCategory],
                requestId,
                recordId: fileIds.length === 1 ? msg.recordId : undefined,
              })
            )
          : [];

        mergePatterns([...imagePatterns, ...filePatterns]);
        patchAssistantMessage(
          targetAssistantId,
          message => ({
            ...message,
            requestId,
            recordId: msg.recordId || message.recordId,
            recordIds: msg.recordIds?.length ? msg.recordIds : message.recordIds,
            artifactStatus: 'READY',
            images: mergeConversationImages(message.images, artifactImages),
          }),
          { taskId: msg.taskId, timestamp: msg.occurredAt }
        );
        setGenState('finalizing');
        break;
      }
      case 'artifact.failed': {
        const requestId = msg.requestId || msg.taskId;
        const failedRecordIds = Array.from(
          new Set([
            ...(msg.recordIds || []),
            msg.recordId,
            msg.fileId,
          ].filter((value): value is string => Boolean(value)))
        );

        mergePatterns(
          (failedRecordIds.length > 0 ? failedRecordIds : [requestId]).map(itemId =>
            buildFailedPattern(requestId, {
              taskId: msg.taskId,
              title: msg.promptSummary || '纹样生成失败',
              desc: msg.promptSummary || '图片生成未成功，可重新发起生成。',
              tags: [selectedCategory],
              recordId: itemId === requestId ? msg.recordId : itemId,
              errorCode: msg.code,
              errorMessage: msg.message || msg.errorMessage,
              retriable: msg.retriable,
            })
          )
        );
        patchAssistantMessage(
          targetAssistantId,
          message => ({
            ...message,
            requestId,
            recordId: msg.recordId || message.recordId,
            recordIds: failedRecordIds.length > 0 ? failedRecordIds : message.recordIds,
            artifactStatus: 'FAILED',
          }),
          { taskId: msg.taskId, timestamp: msg.occurredAt }
        );
        setGenState('failed');
        break;
      }
      case 'artifact.metadata.completed':
        setGenState('finalizing');
        break;
      case 'task.completed':
        setGenState('done');
        setIsStreaming(false);
        clearPersistedTask(msg.sessionId || currentSessionIdRef.current);
        updateCurrentTaskId(null);
        closeTaskStream();
        break;
      case 'task.failed':
        setGenState('failed');
        setIsStreaming(false);
        upsertPersistedTask(msg.sessionId || currentSessionIdRef.current, {
          taskId: msg.taskId,
          assistantMessageId: assistantMsgIdRef.current,
          lastEventId: streamCursor || lastEventIdRef.current,
          status: 'FAILED',
          phase: msg.phase || runtimeRef.current.phase,
          queuePosition: runtimeRef.current.queuePosition,
          estimatedWaitMs: runtimeRef.current.estimatedWaitMs,
          requestId: msg.requestId || runtimeRef.current.requestId,
          patterns: patternsRef.current,
        });
        updateCurrentTaskId(null);
        closeTaskStream();
        toast.error(msg.message || msg.errorMessage || '生成失败');
        break;
      case 'task.rejected':
        setGenState('rejected');
        setIsStreaming(false);
        upsertPersistedTask(msg.sessionId || currentSessionIdRef.current, {
          taskId: msg.taskId,
          assistantMessageId: assistantMsgIdRef.current,
          lastEventId: streamCursor || lastEventIdRef.current,
          status: 'REJECTED',
          phase: msg.phase || runtimeRef.current.phase,
          queuePosition: runtimeRef.current.queuePosition,
          estimatedWaitMs: runtimeRef.current.estimatedWaitMs,
          requestId: msg.requestId || runtimeRef.current.requestId,
          patterns: patternsRef.current,
        });
        updateCurrentTaskId(null);
        closeTaskStream();
        toast.error(msg.displayText || '内容审核未通过');
        break;
      case 'task.cancelled':
        setGenState('cancelled');
        setIsStreaming(false);
        upsertPersistedTask(msg.sessionId || currentSessionIdRef.current, {
          taskId: msg.taskId,
          assistantMessageId: assistantMsgIdRef.current,
          lastEventId: streamCursor || lastEventIdRef.current,
          status: 'CANCELLED',
          phase: msg.phase || runtimeRef.current.phase,
          queuePosition: runtimeRef.current.queuePosition,
          estimatedWaitMs: runtimeRef.current.estimatedWaitMs,
          requestId: msg.requestId || runtimeRef.current.requestId,
          patterns: patternsRef.current,
        });
        updateCurrentTaskId(null);
        closeTaskStream();
        toast.info('任务已取消');
        break;
    }
  };

  const closeTaskStream = () => {
    sseRef.current?.close();
    sseRef.current = null;
  };

  const clearTaskState = () => {
    closeTaskStream();
    updateCurrentTaskId(null);
    updateAssistantMessageId(null);
    updateLastEventId(null);
    resetRuntime();
    clearTaskEventLog();
    setIsStreaming(false);
  };

  const syncTaskRecovery = async (taskId: string, assistantIdHint?: string | null, silent = true) => {
    try {
      const recovery = await syncTaskSnapshot(taskId, assistantIdHint);
      if (!recovery) {
        return;
      }

      const { snapshotState } = recovery;
      if (isTerminalState(snapshotState)) {
        setIsStreaming(false);
        if (shouldClearPersistedTask(recovery.snapshot.status)) {
          clearPersistedTask(recovery.snapshot.sessionId || currentSessionIdRef.current);
        }
        updateCurrentTaskId(null);
        closeTaskStream();
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(err?.message || '任务流恢复失败');
      }
    }
  };

  const subscribeToTask = (taskId: string, assistantId: string | null, resumeLastEventId?: string) => {
    closeTaskStream();

    const expectedSessionId = currentSessionIdRef.current;
    const isCurrentStreamContext = () => {
      if (currentTaskIdRef.current !== taskId) {
        return false;
      }
      if (expectedSessionId && currentSessionIdRef.current !== expectedSessionId) {
        return false;
      }
      return true;
    };

    sseRef.current = chatService.subscribeEvents(
      taskId,
      (msg) => {
        if (!isCurrentStreamContext()) {
          return;
        }
        updateTaskFromMessage(msg, assistantMsgIdRef.current || assistantId || '');
      },
      {
        lastEventId: resumeLastEventId || lastEventIdRef.current || undefined,
        onStatus: (event) => {
          if (!isCurrentStreamContext()) {
            return;
          }
          const connectionSummary = describeConnectionEvent(event);
          pushTaskEvent({
            kind: 'connection',
            title: connectionSummary.title,
            detail: connectionSummary.detail,
            connectionState: event.state,
          });
          patchRuntime({
            connectionState: event.state,
            connectionMessage: event.message ?? null,
          });
          if (event.lastEventId) {
            updateLastEventId(event.lastEventId);
          }
          if (event.state === 'reconnecting' || (event.state === 'connected' && event.attempt > 1)) {
            void syncTaskRecovery(taskId, assistantMsgIdRef.current || assistantId, true);
          }
        },
        onError: (event) => {
          if (!isCurrentStreamContext()) {
            return;
          }
          const connectionSummary = describeConnectionEvent(event);
          pushTaskEvent({
            kind: 'connection',
            title: connectionSummary.title,
            detail: connectionSummary.detail,
            connectionState: 'error',
          });
          patchRuntime({
            connectionState: 'error',
            connectionMessage: event.message ?? null,
          });
        },
      }
    );
  };

  // 侧边栏只展示后端真实会话，接口失败时保持空列表，不再回退到演示数据。
  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await chatService.listSessions({ page: 1, size: 50 });
      const nextSessions: Session[] = (res.data?.records || []).map(session => ({
        id: session.sessionId,
        title: session.title || '新对话',
        category: DEFAULT_CATEGORY.name,
        time: formatSessionTime(session.lastMessageAt || session.createTime),
        group: resolveSessionGroup(session.lastMessageAt || session.createTime),
      }));
      setSessions(nextSessions);
    } catch {
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => { clearRedDot('zhihui'); }, [clearRedDot]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, patterns]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  // 组件卸载时清理 SSE 连接
  useEffect(() => {
    return () => {
      closeTaskStream();
    };
  }, []);

  const isSavedGlobally = (id: string) => savedLibraryPatterns.some(p => p.id === id);

  const handleToggleSave = (pattern: GeneratedPattern) => {
    if (pattern.status !== 'ready') {
      return;
    }
    if (isSavedGlobally(pattern.id)) {
      removeLibraryPattern(pattern.id);
      toast.info(`已从我的纹样移除「${pattern.title}」`);
    } else {
      const now = new Date().toLocaleString('zh', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-');
      const entry: MyPattern = {
        id: pattern.id, title: pattern.title, desc: pattern.desc,
        tags: pattern.tags, imageUrl: pattern.imageUrl,
        savedAt: now, createdAt: now,
        source: 'zhihui', sourceLabel: '智绘AI',
        category: selectedCategory,
        style: '', material: '', colorTone: '',
        rightsStatus: 'none',
        copyrightStatus: 'none',
        published: false,
      };
      addLibraryPattern(entry);
      toast.success(`「${pattern.title}」已收录至我的纹样`, {
        description: '可前往「我的纹样」发起确权',
        action: { label: '前往纹样', onClick: () => navigate('/materials') },
      });
    }
  };

  // 会话切换需要防止旧请求回写，所以用递增版本号拦截陈旧响应。
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const loadSession = async (sessionId: string) => {
    const loadVersion = sessionLoadVersionRef.current + 1;
    sessionLoadVersionRef.current = loadVersion;

    clearTaskState();
    setAttachments([]);
    updateCurrentSessionId(sessionId);
    setActiveSession(sessionId);
    setIsLoadingHistory(true);

    try {
      const res = await chatService.getConversationMessages(sessionId);
      if (sessionLoadVersionRef.current !== loadVersion) {
        return;
      }

      const msgs: ConvMessage[] = (res.data || []).map(m => ({
        id: m.messageId,
        role: normalizeConversationRole(m.role),
        content: m.text,
        category: DEFAULT_CATEGORY.name,
        timestamp: new Date(m.createTime).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
        taskId: m.taskId,
        images: m.images?.map(image => ({
          recordId: image.recordId,
          fileId: image.fileId,
          title: image.title,
          description: image.description,
          tags: image.tags,
          width: image.width,
          height: image.height,
        })),
      }));
      let persistedTask = readPersistedTask(sessionId);
      if (persistedTask && shouldClearPersistedTask(persistedTask.status)) {
        clearPersistedTask(sessionId);
        persistedTask = null;
      }

      const latestAssistantId = resolveLatestAssistantMessageId(msgs);
      const taskAssistantId = persistedTask?.taskId
        ? resolveLatestAssistantMessageId(msgs, persistedTask.taskId)
        : null;
      const activeAssistantId = persistedTask?.taskId && shouldReplayTask(persistedTask.status)
        ? taskAssistantId || persistedTask.assistantMessageId || null
        : latestAssistantId || persistedTask?.assistantMessageId || null;
      setMessages(msgs);
      setPatterns(
        mergePatternCollections(
          persistedTask?.patterns || [],
          extractPatternsFromConversation(msgs)
        )
      );
      updateAssistantMessageId(activeAssistantId);

      if (!persistedTask?.taskId) {
        setGenState('idle');
        setIsStreaming(false);
        return;
      }

      updateCurrentTaskId(persistedTask.taskId);
      updateLastEventId(persistedTask.lastEventId);
      patchRuntime({
        status: persistedTask.status,
        phase: persistedTask.phase,
        queuePosition: persistedTask.queuePosition,
        estimatedWaitMs: persistedTask.estimatedWaitMs,
        requestId: persistedTask.requestId,
      });
      setGenState(mapLifecycleState({
        status: persistedTask.status,
        phase: persistedTask.phase,
      }));

      if (!shouldReplayTask(persistedTask.status)) {
        setIsStreaming(false);
        updateCurrentTaskId(null);
        return;
      }

      setIsStreaming(true);

      try {
        const recovery = await syncTaskSnapshot(
          persistedTask.taskId,
          activeAssistantId
        );
        if (sessionLoadVersionRef.current !== loadVersion) {
          return;
        }

        if (!recovery) {
          setIsStreaming(false);
          return;
        }

        const { snapshot, snapshotState, targetAssistantId } = recovery;
        if (isTerminalState(snapshotState)) {
          setIsStreaming(false);
          if (shouldClearPersistedTask(snapshot.status)) {
            clearPersistedTask(sessionId);
          }
          updateCurrentTaskId(null);
          closeTaskStream();
          return;
        }

        setIsStreaming(true);
        subscribeToTask(
          persistedTask.taskId,
          targetAssistantId,
          snapshot.lastEventId || persistedTask.lastEventId || undefined
        );
      } catch (err: any) {
        if (sessionLoadVersionRef.current !== loadVersion) {
          return;
        }

        setGenState(mapLifecycleState({
          status: persistedTask.status,
          phase: persistedTask.phase,
        }));
        setIsStreaming(false);
        updateCurrentTaskId(null);
        closeTaskStream();
        toast.error(err?.message || '任务恢复失败');
      }
    } catch {
      if (sessionLoadVersionRef.current !== loadVersion) {
        return;
      }

      setMessages([]);
      setPatterns([]);
      toast.error('加载历史记录失败');
      setGenState('idle');
      setIsStreaming(false);
    } finally {
      if (sessionLoadVersionRef.current === loadVersion) {
        setIsLoadingHistory(false);
      }
    }
  };

  const handleNewSession = () => {
    sessionLoadVersionRef.current += 1;
    clearTaskState();
    updateCurrentSessionId(null);

    setNewSessionAnim(true);
    setTimeout(() => setNewSessionAnim(false), 600);
    setActiveSession('new');
    setIsLoadingHistory(false);
    setMessages([]);
    setPatterns([]);
    setZoomPattern(null);
    setGenState('idle');
    setInputValue('');
    setAttachments([]);
    setTimeout(() => inputRef.current?.focus(), 100);
    toast.success(t('新创作空间已就绪', 'New session ready'), { duration: 1500 });
  };

  const clearComposerAttachments = () => {
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePickImages = () => {
    if (isStreaming) return;
    fileInputRef.current?.click();
  };

  const handleUploadImages = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const queue = files.map((file, index) => ({
      file,
      localId: `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    }));

    setAttachments(prev => [
      ...prev,
      ...queue.map(item => ({
        localId: item.localId,
        fileName: item.file.name,
        status: 'uploading' as const,
      })),
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    let successCount = 0;
    await Promise.all(queue.map(async ({ file, localId }) => {
      try {
        const uploaded = await uploadChatImage(file);
        successCount += 1;
        setAttachments(prev => prev.map(item =>
          item.localId === localId
            ? {
                ...item,
                status: 'ready',
                fileId: uploaded.fileId,
                error: undefined,
              }
            : item
        ));
      } catch (err: any) {
        setAttachments(prev => prev.map(item =>
          item.localId === localId
            ? {
                ...item,
                status: 'failed',
                error: err?.message || '上传失败',
              }
            : item
        ));
      }
    }));

    if (successCount > 0) {
      toast.success(`已上传 ${successCount} 张参考图`);
    }
  };

  const handleRemoveAttachment = (localId: string) => {
    setAttachments(prev => prev.filter(item => item.localId !== localId));
  };

  // 普通发送与“再次生图”都走同一条提交流程，确保任务状态、会话刷新和 SSE 订阅完全一致。
  const submitPrompt = async (rawPrompt: string, fileIds: string[] = []) => {
    const promptText = rawPrompt.trim();
    const normalizedFileIds = Array.from(new Set(fileIds.filter(Boolean)));
    if ((!promptText && normalizedFileIds.length === 0) || isStreaming) return;

    sessionLoadVersionRef.current += 1;
    const clientMessageId = `local_${Date.now()}`;
    const displayText = promptText || `上传了 ${normalizedFileIds.length} 张参考图`;
    const userMsg: ConvMessage = {
      id: clientMessageId,
      role: 'user',
      content: displayText,
      category: selectedCategory,
      timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    const assistantId = `assistant_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'system',
      content: '',
      timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
    }]);

    setIsStreaming(true);
    setPatterns([]);
    updateLastEventId(null);
    updateAssistantMessageId(assistantId);
    resetRuntime();
    const submitVersion = sessionLoadVersionRef.current;

    try {
      const imageStyle = DEFAULT_CATEGORY.id.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

      const res = await chatService.submitMessage({
        sessionId: currentSessionId || undefined,
        clientMessageId,
        text: promptText || undefined,
        fileIds: normalizedFileIds.length > 0 ? normalizedFileIds : undefined,
        imageStyle,
      });

      const { sessionId, taskId } = res.data;
      upsertPersistedTask(sessionId, {
        taskId,
        assistantMessageId: assistantId,
        lastEventId: null,
        status: res.data.status,
        phase: res.data.phase,
        queuePosition: res.data.queuePosition ?? null,
        estimatedWaitMs: res.data.estimatedWaitMs ?? null,
        requestId: null,
        patterns: [],
      });
      void refreshSessions();

      const shouldBindToCurrentView =
        sessionLoadVersionRef.current === submitVersion ||
        currentSessionIdRef.current === sessionId;
      if (!shouldBindToCurrentView) {
        return;
      }

      updateCurrentSessionId(sessionId);
      setActiveSession(sessionId);
      updateCurrentTaskId(taskId);
      updateAssistantMessageId(assistantId);
      patchRuntime({
        status: res.data.status,
        phase: res.data.phase,
        queuePosition: res.data.queuePosition ?? null,
        estimatedWaitMs: res.data.estimatedWaitMs ?? null,
      });
      pushTaskEvent({
        kind: 'event',
        title: formatTaskPhase(res.data.phase) || '任务已创建',
        detail: [
          formatTaskStatus(res.data.status),
          res.data.queuePosition != null ? `前方 ${res.data.queuePosition} 个任务` : null,
          res.data.estimatedWaitMs != null ? `预计 ${formatEstimatedWait(res.data.estimatedWaitMs)}` : null,
        ].filter((item): item is string => Boolean(item)).join(' · '),
      });
      setGenState(mapLifecycleState({ status: res.data.status, phase: res.data.phase }));
      clearComposerAttachments();
      subscribeToTask(taskId, assistantId);
    } catch (err: any) {
      if (sessionLoadVersionRef.current !== submitVersion) {
        return;
      }
      setIsStreaming(false);
      setGenState('idle');
      resetRuntime();
      toast.error(err.message || '提交失败');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    }
  };

  const handleSend = async () => {
    const hasUploadingAttachment = attachments.some(item => item.status === 'uploading');
    if (hasUploadingAttachment) {
      toast.info('图片上传中，请稍候发送');
      return;
    }
    const readyFileIds = attachments
      .filter(item => item.status === 'ready' && item.fileId)
      .map(item => item.fileId as string);
    await submitPrompt(inputValue, readyFileIds);
  };

  const handleRegen = async (pattern: GeneratedPattern) => {
    if (pattern.status === 'pending') {
      return;
    }
    await submitPrompt(buildRegeneratePrompt(pattern));
  };

  const renderPatternSection = (messagePatterns: GeneratedPattern[]) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-xs text-[#9B9590] mb-4 px-0.5">
        {messagePatterns.length} 个创作方向 · 点击图片查看大图
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 items-start">
        {messagePatterns.map((pattern, i) => {
          const isReady = pattern.status === 'ready';
          const isPending = pattern.status === 'pending';
          const isFailed = pattern.status === 'failed';
          const saved = isReady && isSavedGlobally(pattern.id);
          const cardBorder = isReady
            ? (saved ? '2px solid rgba(13,148,136,0.45)' : '1px solid rgba(196,145,42,0.12)')
            : isPending
              ? '1px solid rgba(196,145,42,0.14)'
              : '1px solid rgba(180,60,60,0.18)';
          const cardShadow = isReady
            ? (saved
                ? '0 0 0 3px rgba(13,148,136,0.07), 0 8px 32px rgba(26,61,74,0.1)'
                : '0 4px 24px rgba(26,61,74,0.08)')
            : isPending
              ? '0 4px 20px rgba(26,61,74,0.06)'
              : '0 4px 20px rgba(180,60,60,0.08)';

          return (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', damping: 24, stiffness: 280 }}
              className="group rounded-3xl overflow-hidden"
              style={{
                background: 'white',
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div className="relative overflow-hidden" style={{ paddingBottom: '76%' }}>
                {isReady ? (
                  <>
                    <ProtectedImage
                      src={pattern.imageUrl}
                      alt={pattern.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                      onClick={() => setZoomPattern(pattern)}
                    />
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(11,20,30,0.72) 0%, rgba(11,20,30,0.05) 42%, transparent 100%)' }} />
                    <button
                      type="button"
                      onClick={() => setZoomPattern(pattern)}
                      className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100"
                      style={{
                        background: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-4 py-3.5">
                      <p className="text-white text-sm mb-2" style={{ fontWeight: 600, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                        {pattern.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(196,145,42,0.35)', color: '#F5D88A', backdropFilter: 'blur(4px)' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
                    style={{
                      background: isPending
                        ? 'linear-gradient(135deg, rgba(245,240,232,0.9), rgba(255,255,255,0.95))'
                        : 'linear-gradient(135deg, rgba(255,244,244,0.95), rgba(255,255,255,0.98))',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{
                        background: isPending ? 'rgba(196,145,42,0.12)' : 'rgba(180,60,60,0.1)',
                        color: isPending ? '#C4912A' : '#B23A3A',
                      }}
                    >
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    </div>
                    <p className="text-sm mb-1" style={{ fontWeight: 600, color: isPending ? '#1A3D4A' : '#8B2020' }}>
                      {PATTERN_STATUS_LABELS[pattern.status]}
                    </p>
                    {!isPending && (
                      <>
                        <p className="text-xs leading-relaxed" style={{ color: '#6B6558' }}>
                          {pattern.title}
                        </p>
                        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#9B9590' }}>
                          {pattern.desc}
                        </p>
                      </>
                    )}
                    {isFailed && pattern.errorMessage && (
                      <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#B23A3A' }}>
                        {pattern.errorMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!isPending && (
                <div className="flex items-center gap-2 px-4 py-3"
                  style={{ background: 'linear-gradient(to right, #FDFAF5, #FBF7EE)', borderTop: '1px solid rgba(196,145,42,0.1)' }}>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] leading-5 text-[#6B6558]"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {pattern.desc}
                    </p>
                  </div>
                  {isReady ? (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleSave(pattern); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all flex-shrink-0"
                        style={saved
                          ? { background: 'rgba(13,148,136,0.1)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.25)' }
                          : { background: 'rgba(196,145,42,0.08)', color: '#B8821E', border: '1px solid rgba(196,145,42,0.22)' }
                        }
                        onMouseEnter={e => {
                          if (!saved) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.16)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,145,42,0.4)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!saved) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,145,42,0.22)';
                          }
                        }}
                      >
                        {saved
                          ? <><BookmarkCheck className="w-3 h-3" /> 已收录</>
                          : <><Bookmark className="w-3 h-3" /> 收录至我的纹库</>
                        }
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleRegen(pattern); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all flex-shrink-0"
                        style={{
                          background: 'rgba(26,61,74,0.06)',
                          color: '#6B6558',
                          border: '1px solid rgba(26,61,74,0.1)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(26,61,74,0.1)';
                          (e.currentTarget as HTMLElement).style.color = '#1A3D4A';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(26,61,74,0.06)';
                          (e.currentTarget as HTMLElement).style.color = '#6B6558';
                        }}
                      >
                        <RotateCcw className="w-3 h-3" /> 再次生图
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); handleRegen(pattern); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all flex-shrink-0"
                      style={{
                        background: 'rgba(180,60,60,0.08)',
                        color: '#8B2020',
                        border: '1px solid rgba(180,60,60,0.18)',
                      }}
                    >
                      <RotateCcw className="w-3 h-3" /> 再次生图
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
        className="text-center text-[11px] mt-4 text-[#9B9590]"
      >
        点击图片可放大查看 · 在大图中可收录至我的纹库
      </motion.p>
    </motion.div>
  );

  // 取消正在进行的任务
  const handleCancel = async () => {
    if (!currentTaskId) return;
    try {
      const res = await chatService.cancelTask(currentTaskId);
      patchRuntime({
        status: res.data.status,
        phase: res.data.phase ?? runtimeRef.current.phase,
      });
      upsertPersistedTask(currentSessionIdRef.current, {
        taskId: currentTaskId,
        assistantMessageId: assistantMsgIdRef.current,
        lastEventId: lastEventIdRef.current,
        status: res.data.status,
        phase: res.data.phase ?? runtimeRef.current.phase,
        queuePosition: runtimeRef.current.queuePosition,
        estimatedWaitMs: runtimeRef.current.estimatedWaitMs,
        requestId: runtimeRef.current.requestId,
        patterns: patternsRef.current,
      });
      setGenState(mapLifecycleState({ status: res.data.status, phase: res.data.phase }));
      if (res.data.status !== 'CANCEL_REQUESTED') {
        setIsStreaming(false);
        updateCurrentTaskId(null);
        closeTaskStream();
      }
    } catch (err: any) {
      toast.error(err.message || '取消失败');
    }
  };

  const hasUploadingAttachment = attachments.some(item => item.status === 'uploading');
  const readyAttachmentCount = attachments.filter(item => item.status === 'ready' && item.fileId).length;
  const canSendPrompt = !isStreaming && !hasUploadingAttachment && (Boolean(inputValue.trim()) || readyAttachmentCount > 0);

  const isGenerating = genState !== 'idle' && !isTerminalState(genState);
  const showTerminalStatus = genState !== 'idle' && isTerminalState(genState) && genState !== 'done';
  const showStatusText = isGenerating || showTerminalStatus;
  const taskStatusText = genState !== 'idle' ? TASK_STAGE_COPY[genState] : '';
  const taskStatusHint = isGenerating
    ? [
        runtime.queuePosition != null ? `前方 ${runtime.queuePosition} 个任务` : null,
        runtime.connectionState && runtime.connectionState !== 'connected'
          ? formatConnectionState(runtime.connectionState, runtime.connectionMessage)
          : null,
      ].filter((item): item is string => Boolean(item)).join(' · ')
    : '';
  const taskStatusLine = [
    taskStatusText,
    taskStatusHint || null,
  ].filter((item): item is string => Boolean(item)).join(' · ');
  const taskStatusTone = showTerminalStatus
    ? genState === 'done'
      ? '#0d9488'
      : genState === 'failed' || genState === 'rejected' || genState === 'cancelled'
        ? '#B23A3A'
        : '#1A3D4A'
    : '#1A3D4A';
  const sessionGroups = [
    { key: 'today' as const, label: '今日', items: sessions.filter(s => s.group === 'today') },
    { key: 'week'  as const, label: '本周', items: sessions.filter(s => s.group === 'week')  },
    { key: 'month' as const, label: '本月', items: sessions.filter(s => s.group === 'month') },
  ];

  return (
    <div className="flex h-full" style={{ background: '#F5F0E8' }}>

      {/* ── Left: Session Sidebar ─────────────────────────────── */}
      <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'white', borderRight: '1px solid rgba(26,61,74,0.07)' }}>

        {/* New session button */}
        <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
          <motion.button
            onClick={handleNewSession} whileTap={{ scale: 0.97 }}
            animate={newSessionAnim ? { scale: [1, 0.96, 1.02, 1] } : {}}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
            <Plus className="w-4 h-4" /> {t('新建创作', 'New')}
          </motion.button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'none' }}>
          {/* Loading indicator */}
          {isLoadingSessions && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[#C4912A]" />
            </div>
          )}
          {/* Current new session */}
          {activeSession === 'new' && (
            <div className="px-3 py-2 rounded-xl mb-2"
              style={{ background: 'rgba(196,145,42,0.07)', border: '1px solid rgba(196,145,42,0.18)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4912A] animate-pulse" />
                <span className="text-xs text-[#C4912A]" style={{ fontWeight: 500 }}>当前创作</span>
              </div>
              {messages.length > 0 && (
                <p className="text-[10px] text-[#9B9590] mt-0.5 truncate">
                  {messages[0]?.content.slice(0, 22)}
                  {messages[0]?.content && messages[0].content.length > 22 ? '…' : ''}
                </p>
              )}
            </div>
          )}

          {sessionGroups.map(group => group.items.length > 0 && (
            <div key={group.key} className="mb-3">
              <p className="text-[10px] px-2 mb-1" style={{ color: 'rgba(26,61,74,0.3)', letterSpacing: '0.06em' }}>
                {group.label}
              </p>
              {group.items.map(session => {
                const isActive = activeSession === session.id;
                const catStyle = CAT_COLORS[session.category] ?? CAT_COLORS['云锦'];
                return (
                  <button key={session.id}
                    onClick={() => { setActiveSession(session.id); loadSession(session.id); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all"
                    style={{
                      background: isActive ? '#F0E6D3' : 'transparent',
                      borderLeft: isActive ? '2px solid #C4912A' : '2px solid transparent',
                    }}>
                    <p className="text-xs text-[#1A3D4A] truncate mb-1.5"
                      style={{ fontWeight: isActive ? 500 : 400 }}>
                      {session.title}
                    </p>
                    {/* ② Always show category tag + time */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: catStyle.bg, color: catStyle.text }}>
                        {session.category}
                      </span>
                      <Clock className="w-2.5 h-2.5 text-[#C4A88A]" />
                      <span className="text-[10px] text-[#9B9590]">{session.time.slice(5)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {!isLoadingSessions && sessions.length === 0 && (
            <div className="px-3 py-6 text-[11px] text-[#9B9590] leading-relaxed">
              暂无历史会话，发送第一条创作需求后会自动出现在这里。
            </div>
          )}
        </div>

        {/* ③ Sidebar bottom: removed Pro plan section ── */}
      </div>

      {/* ── Center: Creation Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header — clean, no saved-count */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'rgba(245,240,232,0.85)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C4912A]" />
              <span className="text-[#1A3D4A]" style={{ fontSize: 18, fontWeight: 600 }}>智绘</span>
            </div>
            <p className="text-xs text-[#9B9590] mt-0.5">非遗纹样智能创作 · 云锦工艺</p>
          </div>
        </div>

        {/* Chat + results area */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin' }}>

          {/* Loading history */}
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-[#9B9590]">
              <Loader2 className="w-4 h-4 animate-spin text-[#C4912A]" />
              加载历史记录...
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && !isGenerating && !isLoadingHistory && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60%] text-center">
              <div className="w-20 h-20 rounded-2xl mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.1), rgba(26,61,74,0.07))' }}>
                <Sparkles className="w-9 h-9 text-[#C4912A]" />
              </div>
              <h2 className="text-[#1A3D4A] mb-2">描述你的创意方向</h2>
              <p className="text-sm text-[#9B9590] max-w-sm leading-relaxed mb-8">
                AI 将基于云锦工艺规则生成一组纹样方向，并在生成过程中实时回传任务状态与图片结果。
              </p>
              <div className="w-full max-w-lg space-y-2">
                {SAMPLE_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => setInputValue(prompt)}
                    className="w-full text-left px-4 py-3 rounded-2xl text-sm"
                    style={{ background: 'white', border: '1px solid rgba(26,61,74,0.07)', color: '#1A3D4A' }}
                    whileHover={{ borderColor: 'rgba(196,145,42,0.35)', y: -1 }}
                  >
                    <span className="mr-2 text-[#C4912A]">→</span>
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map(msg => {
            const messagePatterns = getPatternsForMessage(msg);
            const showInlineStatus =
              msg.role === 'system' &&
              msg.id === assistantMsgId &&
              showStatusText &&
              Boolean(taskStatusLine);
            const assistantText = msg.content.trim();
            const hasAssistantText = assistantText.length > 0;
            const shouldRenderSystemMessage =
              msg.role !== 'system' ||
              hasAssistantText ||
              showInlineStatus ||
              messagePatterns.length > 0;

            if (!shouldRenderSystemMessage) {
              return null;
            }

            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                  <>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                      <Sparkles className="w-3.5 h-3.5 text-[#C4912A]" />
                    </div>
                    <div className="min-w-0 w-full">
                      {hasAssistantText && (
                        <div
                          className="max-w-2xl px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed text-[#1A3D4A]"
                          style={{ background: 'white', border: '1px solid rgba(26,61,74,0.07)' }}
                        >
                          {assistantText}
                          <div className="text-[10px] mt-1.5 text-[#9B9590]">
                            {msg.timestamp}
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {showInlineStatus && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="mt-3 px-0.5"
                          >
                            <div className="pt-1 text-sm leading-relaxed" style={{ color: taskStatusTone }}>
                              <span className="inline-flex items-center gap-2">
                                {isGenerating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4912A]" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                )}
                                <span>{taskStatusLine}</span>
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {messagePatterns.length > 0 && (
                        <div className="mt-4">
                          {renderPatternSection(messagePatterns)}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="max-w-2xl px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
                    style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                    {msg.category && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2 mr-2"
                        style={{ background: 'rgba(196,145,42,0.2)', color: '#C4912A' }}>{msg.category}</span>
                    )}
                    {msg.content}
                    <div className="text-[10px] mt-1.5 text-white/35">
                      {msg.timestamp}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ── Input Bar ────────────────────────────────── */}
        <div className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(26,61,74,0.07)', background: 'rgba(245,240,232,0.9)' }}>
          <div className="p-2 rounded-2xl"
            style={{ background: 'white', border: '1px solid rgba(26,61,74,0.1)', boxShadow: '0 1px 12px rgba(26,61,74,0.06)' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={e => { void handleUploadImages(e.target.files); }}
            />

            {attachments.length > 0 && (
              <div className="mb-2 px-1 flex flex-wrap gap-2">
                {attachments.map(item => (
                  <div
                    key={item.localId}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                    style={{
                      background: item.status === 'failed'
                        ? 'rgba(180,60,60,0.08)'
                        : item.status === 'uploading'
                          ? 'rgba(196,145,42,0.1)'
                          : 'rgba(26,61,74,0.08)',
                      color: item.status === 'failed'
                        ? '#8B2020'
                        : item.status === 'uploading'
                          ? '#B8821E'
                          : '#1A3D4A',
                    }}
                  >
                    {item.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span className="max-w-[180px] truncate">{item.fileName}</span>
                    {item.status === 'failed' && item.error && <span className="opacity-75">({item.error})</span>}
                    <button
                      onClick={() => handleRemoveAttachment(item.localId)}
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.06)' }}
                      title="移除"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div
                className="flex items-center px-3 py-2 rounded-xl text-xs flex-shrink-0"
                style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A' }}
              >
                {selectedCategory}
              </div>

              <button
                onClick={handlePickImages}
                disabled={isStreaming}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: isStreaming ? 'rgba(26,61,74,0.07)' : 'rgba(26,61,74,0.08)',
                  color: isStreaming ? 'rgba(26,61,74,0.35)' : '#1A3D4A',
                }}
                title="上传参考图"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (canSendPrompt) {
                      void handleSend();
                    }
                  }
                }}
                placeholder="描述纹样风格、用途场景、文化意象... (Shift+Enter 换行)"
                rows={1}
                className="flex-1 text-sm bg-transparent outline-none resize-none text-[#1A3D4A] placeholder:text-[#9B9590] py-2 leading-relaxed"
                style={{ maxHeight: 120, overflowY: 'auto', scrollbarWidth: 'none' }}
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />

              {/* Send / Cancel */}
              {isStreaming ? (
                <button onClick={handleCancel}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: 'rgba(139,32,32,0.12)', color: '#8B2020' }}
                  title="取消任务">
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!canSendPrompt}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: canSendPrompt ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.07)',
                    color: canSendPrompt ? 'white' : 'rgba(26,61,74,0.3)',
                  }}>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomPattern && (
          <ImageZoomModal
            pattern={zoomPattern}
            isSaved={isSavedGlobally(zoomPattern.id)}
            onToggleSave={() => handleToggleSave(zoomPattern)}
            onRegen={() => handleRegen(zoomPattern)}
            onClose={() => setZoomPattern(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
