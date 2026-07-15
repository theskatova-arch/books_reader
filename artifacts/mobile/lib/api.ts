const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '') || 'http://localhost:3000';

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  token?: string | null;
  headers?: Record<string, string>;
}

export async function apiRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const { token, headers = {}, ...rest } = options;
  const allHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${BASE_URL}${path}`, { ...rest, headers: allHeaders });
}

export async function apiJSON<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await apiRequest(path, options);
  const body = await res.json() as T & { error?: string };
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return body;
}
