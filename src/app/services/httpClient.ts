import { getValidAccessToken, readAuthSession, refreshAccessToken } from './authSession';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
  requestId?: string;
}

interface FetchWithAuthOptions {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

function withAuthorizationHeader(headers: HeadersInit | undefined, token: string | null) {
  const nextHeaders = new Headers(headers ?? undefined);

  if (token) {
    nextHeaders.set('Authorization', `Bearer ${token}`);
  } else {
    nextHeaders.delete('Authorization');
  }

  return nextHeaders;
}

export async function fetchWithAutoRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchWithAuthOptions = {}
) {
  const { auth = true, retryOnUnauthorized = auth } = options;

  const runRequest = async (token: string | null) =>
    fetch(input, {
      ...init,
      headers: withAuthorizationHeader(init.headers, token),
    });

  const token = auth ? await getValidAccessToken() : null;
  let response = await runRequest(token);

  if (!auth || !retryOnUnauthorized || response.status !== 401) {
    return response;
  }

  const { refreshToken } = readAuthSession();
  if (!refreshToken) {
    return response;
  }

  try {
    const nextToken = await refreshAccessToken();
    response = await runRequest(nextToken);
  } catch {
    return response;
  }

  return response;
}

export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  options: FetchWithAuthOptions = {}
) {
  const headers = new Headers(init.headers ?? undefined);

  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetchWithAutoRefresh(
    url,
    {
      ...init,
      headers,
    },
    options
  );

  let data: ApiResponse<T> | null = null;

  try {
    data = await response.json() as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    throw new Error('响应格式错误');
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  if (!data || (data.code !== 0 && data.code !== 200)) {
    throw new Error(data?.message || '请求失败');
  }

  return data;
}
