import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { booksApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Book, BookStatus } from '@/types/books';

export type { BookStatus, Book };

interface BooksContextType {
  books: Book[];
  addBook: (title: string, author: string, status: BookStatus) => Promise<void>;
  moveBook: (id: string, newStatus: BookStatus) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  updateDates: (
    id: string,
    fields: { startedReadingAt?: number; finishedAt?: number },
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await booksApi.list();
      setBooks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      reload();
    } else {
      setBooks([]);
      setIsLoading(false);
      setError(null);
    }
  }, [token, reload]);

  const addBook = useCallback(
    async (title: string, author: string, status: BookStatus) => {
      const now = Date.now();
      const book = await booksApi.create({
        title: title.trim(),
        author: author.trim(),
        status,
        addedAt: now,
        startedReadingAt: status === 'reading' ? now : undefined,
        finishedAt: status === 'read' ? now : undefined,
      });
      setBooks((prev) => [book, ...prev]);
    },
    [],
  );

  const moveBook = useCallback(
    async (id: string, newStatus: BookStatus) => {
      const current = books.find((b) => b.id === id);
      if (!current) return;

      const payload: { status: BookStatus; startedReadingAt?: number; finishedAt?: number } = {
        status: newStatus,
      };
      if (newStatus === 'reading' && current.startedReadingAt == null) {
        payload.startedReadingAt = Date.now();
      }
      if (newStatus === 'read' && current.finishedAt == null) {
        payload.finishedAt = Date.now();
      }

      // Optimistic update
      setBooks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, ...payload } : b,
        ),
      );

      try {
        const updated = await booksApi.update(id, payload);
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      } catch {
        // Roll back on failure
        setBooks((prev) => prev.map((b) => (b.id === id ? current : b)));
        throw new Error('Не удалось переместить книгу');
      }
    },
    [books],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      const snapshot = books;
      setBooks((prev) => prev.filter((b) => b.id !== id));
      try {
        await booksApi.remove(id);
      } catch {
        setBooks(snapshot);
        throw new Error('Не удалось удалить книгу');
      }
    },
    [books],
  );

  const updateDates = useCallback(
    async (
      id: string,
      fields: { startedReadingAt?: number; finishedAt?: number },
    ) => {
      const current = books.find((b) => b.id === id);
      if (!current) return;

      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...fields } : b)),
      );
      try {
        const updated = await booksApi.update(id, fields);
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      } catch {
        setBooks((prev) => prev.map((b) => (b.id === id ? current : b)));
        throw new Error('Не удалось обновить даты');
      }
    },
    [books],
  );

  return (
    <BooksContext.Provider
      value={{ books, addBook, moveBook, deleteBook, updateDates, isLoading, error, reload }}
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
