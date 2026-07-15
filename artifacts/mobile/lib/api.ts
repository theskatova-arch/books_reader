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
  try {
    return await fetch(`${BASE_URL}${path}`, { ...rest, headers: allHeaders });
  } catch {
    throw new Error('Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.');
  }
}

export async function apiJSON<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await apiRequest(path, options);
  let body: T & { error?: string };
  try {
    body = await res.json() as T & { error?: string };
  } catch {
    throw new Error(`Ошибка сервера (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(body.error ?? `Ошибка сервера (${res.status})`);
  }
  return body;
}
