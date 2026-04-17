export interface AuthUser {
  id: string;
  account: string;
  displayName: string;
  avatarUrl?: string;
  badge?: string;
}

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: AuthUser;
}

export interface AuthSessionSnapshot {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: AuthUser | null;
}

interface RefreshResponse {
  code?: number;
  message?: string;
  data?: TokenPayload;
}

const AUTH_API_BASE = '/api';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';
const AUTH_USER_KEY = 'authUser';
const REFRESH_LEEWAY_MS = 60_000;

type AuthSessionListener = (snapshot: AuthSessionSnapshot) => void;

const listeners = new Set<AuthSessionListener>();
let refreshPromise: Promise<string | null> | null = null;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function parseStoredNumber(raw: string | null): number | null {
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readStoredAccessToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function readStoredRefreshToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function readStoredExpiresAt() {
  if (!canUseStorage()) return null;
  return parseStoredNumber(window.localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY));
}

export function readStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  return parseStoredUser(window.localStorage.getItem(AUTH_USER_KEY));
}

export function readAuthSession(): AuthSessionSnapshot {
  return {
    accessToken: readStoredAccessToken(),
    refreshToken: readStoredRefreshToken(),
    expiresAt: readStoredExpiresAt(),
    user: readStoredUser(),
  };
}

function emitAuthSessionChange() {
  const snapshot = readAuthSession();
  listeners.forEach(listener => listener(snapshot));
}

export function subscribeAuthSession(listener: AuthSessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function persistAuthSession(payload: TokenPayload) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);

  const expiresAt = Date.now() + Math.max(Number(payload.expiresIn) || 0, 0) * 1000;
  window.localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));

  if (payload.user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  }

  emitAuthSessionChange();
}

export function setStoredUser(user: AuthUser | null) {
  if (!canUseStorage()) return;

  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_USER_KEY);
  }

  emitAuthSessionChange();
}

export function clearAuthSession() {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);

  emitAuthSessionChange();
}

function shouldRefreshToken(expiresAt: number | null) {
  return expiresAt === null || Date.now() + REFRESH_LEEWAY_MS >= expiresAt;
}

function getErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = body.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function doRefreshAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = readAuthSession();

  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  const response = await fetch(`${AUTH_API_BASE}/client/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken: accessToken ?? '',
      refreshToken,
    }),
  });

  let body: RefreshResponse | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    clearAuthSession();
    throw new Error(getErrorMessage(body, `HTTP ${response.status}`));
  }

  if (!body || (body.code !== 0 && body.code !== 200) || !body.data?.accessToken || !body.data.refreshToken) {
    clearAuthSession();
    throw new Error(getErrorMessage(body, '刷新 token 失败'));
  }

  persistAuthSession(body.data);
  return body.data.accessToken;
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function getValidAccessToken(options: { forceRefresh?: boolean } = {}) {
  const { accessToken, refreshToken, expiresAt } = readAuthSession();

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (!refreshToken) {
    return accessToken;
  }

  if (!accessToken || options.forceRefresh || shouldRefreshToken(expiresAt)) {
    return refreshAccessToken();
  }

  return accessToken;
}
