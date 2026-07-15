import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, BookStatus } from '@/types/books';
import { AuthContext } from '@/context/AuthContext';
import { apiJSON, apiRequest } from '@/lib/api';

export type { BookStatus, Book };

const LOCAL_KEY = '@books:data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Local AsyncStorage helpers (used when not authenticated) ──────────────

async function loadLocal(): Promise<Book[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Book[]) : [];
  } catch { return []; }
}

async function saveLocal(books: Book[]): Promise<void> {
  try { await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(books)); } catch { /* ignore */ }
}

async function clearLocal(): Promise<void> {
  try { await AsyncStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ }
}

// ─── Context types ─────────────────────────────────────────────────────────

interface BooksContextType {
  books: Book[];
  addBook: (title: string, author: string, status: BookStatus, coverUrl?: string) => Promise<void>;
  moveBook: (id: string, newStatus: BookStatus) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  updateDates: (id: string, fields: { startedReadingAt?: number; finishedAt?: number }) => Promise<void>;
  updateComment: (id: string, comment: string | null) => Promise<void>;
  updateRating: (id: string, rating: number | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const token = auth?.user?.token ?? null;

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether we've already migrated local books for this token
  const migratedRef = useRef<string | null>(null);

  // ── Reload ────────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        const data = await apiJSON<Book[]>('/api/books', { token });
        setBooks(data);
      } else {
        const data = await loadLocal();
        setBooks(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ── Migrate local → server on first login ─────────────────────────────────
  useEffect(() => {
    if (!token || migratedRef.current === token) return;
    migratedRef.current = token;

    (async () => {
      setIsLoading(true);
      try {
        // 1. Fetch existing server books
        const serverBooks = await apiJSON<Book[]>('/api/books', { token });

        // 2. Check for unsynced local books
        const local = await loadLocal();
        const serverIds = new Set(serverBooks.map((b) => b.id));
        const toUpload = local.filter((b) => !serverIds.has(b.id));

        // 3. Upload each local book that isn't already on the server
        for (const b of toUpload) {
          await apiRequest('/api/books', {
            method: 'POST',
            token,
            body: JSON.stringify({
              id: b.id,
              title: b.title,
              author: b.author,
              status: b.status,
              addedAt: b.addedAt,
              startedReadingAt: b.startedReadingAt,
              finishedAt: b.finishedAt,
              coverUrl: b.coverUrl,
            }),
          });
        }

        // 4. Clear local cache and reload from server
        await clearLocal();
        const merged = await apiJSON<Book[]>('/api/books', { token });
        setBooks(merged);
      } catch {
        // Migration failed — fall back to showing whatever is already loaded
        await reload();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, reload]);

  // ── Initial load (no migration needed) ───────────────────────────────────
  useEffect(() => {
    if (auth?.isLoading) return; // wait for auth to resolve
    reload();
  }, [reload, auth?.isLoading]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addBook = useCallback(
    async (title: string, author: string, status: BookStatus, coverUrl?: string) => {
      const now = Date.now();
      if (token) {
        const book = await apiJSON<Book>('/api/books', {
          method: 'POST',
          token,
          body: JSON.stringify({
            title: title.trim(),
            author: author.trim(),
            status,
            addedAt: now,
            startedReadingAt: status === 'reading' ? now : undefined,
            finishedAt: status === 'read' ? now : undefined,
            coverUrl,
          }),
        });
        setBooks((prev) => [book, ...prev]);
      } else {
        const book: Book = {
          id: generateId(),
          title: title.trim(),
          author: author.trim(),
          status,
          addedAt: now,
          startedReadingAt: status === 'reading' ? now : undefined,
          finishedAt: status === 'read' ? now : undefined,
          coverUrl,
        };
        const next = [book, ...books];
        setBooks(next);
        await saveLocal(next);
      }
    },
    [token, books],
  );

  const moveBook = useCallback(
    async (id: string, newStatus: BookStatus) => {
      const current = books.find((b) => b.id === id);
      if (!current) return;
      const patch: Partial<Book> = { status: newStatus };
      if (newStatus === 'reading' && current.startedReadingAt == null)
        patch.startedReadingAt = Date.now();
      if (newStatus === 'read' && current.finishedAt == null)
        patch.finishedAt = Date.now();

      if (token) {
        const updated = await apiJSON<Book>(`/api/books/${id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(patch),
        });
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      } else {
        const next = books.map((b) => (b.id === id ? { ...b, ...patch } : b));
        setBooks(next);
        await saveLocal(next);
      }
    },
    [token, books],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      if (token) {
        await apiRequest(`/api/books/${id}`, { method: 'DELETE', token });
        setBooks((prev) => prev.filter((b) => b.id !== id));
      } else {
        const next = books.filter((b) => b.id !== id);
        setBooks(next);
        await saveLocal(next);
      }
    },
    [token, books],
  );

  const updateDates = useCallback(
    async (id: string, fields: { startedReadingAt?: number; finishedAt?: number }) => {
      if (token) {
        const updated = await apiJSON<Book>(`/api/books/${id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(fields),
        });
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      } else {
        const next = books.map((b) => (b.id === id ? { ...b, ...fields } : b));
        setBooks(next);
        await saveLocal(next);
      }
    },
    [token, books],
  );

  const updateComment = useCallback(
    async (id: string, comment: string | null) => {
      if (token) {
        const updated = await apiJSON<Book>(`/api/books/${id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({ comment }),
        });
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      } else {
        const next = books.map((b) =>
          b.id === id ? { ...b, comment: comment ?? undefined } : b,
        );
        setBooks(next);
        await saveLocal(next);
      }
    },
    [token, books],
  );

  const updateRating = useCallback(
    async (id: string, rating: number | null) => {
      if (token) {
        const updated = await apiJSON<Book>(`/api/books/${id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({ rating }),
        });
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      } else {
        const next = books.map((b) =>
          b.id === id ? { ...b, rating: rating ?? undefined } : b,
        );
        setBooks(next);
        await saveLocal(next);
      }
    },
    [token, books],
  );

  return (
    <BooksContext.Provider
      value={{ books, addBook, moveBook, deleteBook, updateDates, updateComment, updateRating, isLoading, error, reload }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks must be used within BooksProvider');
  return ctx;
}
