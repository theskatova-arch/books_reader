import type { Book, BookStatus } from '@/types/books';

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  // Local fallback (web/simulator without proxy)
  return 'http://localhost:8080/api';
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

let _token: string | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json()) as { error?: string } & T;
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? 'Ошибка запроса');
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthResponse {
  token: string;
  username: string;
}

export const authApi = {
  register: (username: string, password: string) =>
    request<AuthResponse>('POST', '/auth/register', { username, password }),

  login: (username: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { username, password }),
};

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export interface CreateBookPayload {
  title: string;
  author: string;
  status: BookStatus;
  addedAt: number;
  startedReadingAt?: number;
  finishedAt?: number;
}

export interface UpdateBookPayload {
  status?: BookStatus;
  startedReadingAt?: number;
  finishedAt?: number;
}

export const booksApi = {
  list: () => request<Book[]>('GET', '/books'),
  create: (payload: CreateBookPayload) =>
    request<Book>('POST', '/books', payload),
  update: (id: string, payload: UpdateBookPayload) =>
    request<Book>('PUT', `/books/${id}`, payload),
  remove: (id: string) => request<void>('DELETE', `/books/${id}`),
};
