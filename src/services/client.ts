const ACCESS_KEY = 'mboatalk_access_token';
const REFRESH_KEY = 'mboatalk_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  retry?: boolean;
}

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  const res = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh })
  });

  if (!res.ok) {
    tokenStore.clear();
    return null;
  }

  const data = await res.json();
  tokenStore.set(data.accessToken, data.refreshToken);
  return data.accessToken;
};

export const apiFetch = async <T = any>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers = {}, retry = true } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  const access = tokenStore.getAccess();
  if (access) {
    requestHeaders['Authorization'] = `Bearer ${access}`;
  }

  const res = await fetch(path, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch<T>(path, { ...options, retry: false });
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(json?.error || `Erreur HTTP ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }
  return json as T;
};
