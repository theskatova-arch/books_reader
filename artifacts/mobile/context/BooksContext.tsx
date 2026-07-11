import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, BookStatus } from '@/types/books';

export type { BookStatus, Book };

const STORAGE_KEY = '@books:data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function loadBooks(): Promise<Book[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Book[];
  } catch {
    return [];
  }
}

async function saveBooks(books: Book[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch {
    // ignore
  }
}

interface BooksContextType {
  books: Book[];
  addBook: (
    title: string,
    author: string,
    status: BookStatus,
    coverUrl?: string,
  ) => Promise<void>;
  moveBook: (id: string, newStatus: BookStatus) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  updateDates: (
    id: string,
    fields: { startedReadingAt?: number; finishedAt?: number },
  ) => Promise<void>;
  updateComment: (id: string, comment: string | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadBooks();
      setBooks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addBook = useCallback(
    async (title: string, author: string, status: BookStatus, coverUrl?: string) => {
      const now = Date.now();
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
      await saveBooks(next);
    },
    [books],
  );

  const moveBook = useCallback(
    async (id: string, newStatus: BookStatus) => {
      const current = books.find((b) => b.id === id);
      if (!current) return;

      const patch: Partial<Book> = { status: newStatus };
      if (newStatus === 'reading' && current.startedReadingAt == null) {
        patch.startedReadingAt = Date.now();
      }
      if (newStatus === 'read' && current.finishedAt == null) {
        patch.finishedAt = Date.now();
      }

      const next = books.map((b) => (b.id === id ? { ...b, ...patch } : b));
      setBooks(next);
      await saveBooks(next);
    },
    [books],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      const next = books.filter((b) => b.id !== id);
      setBooks(next);
      await saveBooks(next);
    },
    [books],
  );

  const updateDates = useCallback(
    async (id: string, fields: { startedReadingAt?: number; finishedAt?: number }) => {
      const next = books.map((b) => (b.id === id ? { ...b, ...fields } : b));
      setBooks(next);
      await saveBooks(next);
    },
    [books],
  );

  const updateComment = useCallback(
    async (id: string, comment: string | null) => {
      const next = books.map((b) =>
        b.id === id ? { ...b, comment: comment ?? undefined } : b,
      );
      setBooks(next);
      await saveBooks(next);
    },
    [books],
  );

  return (
    <BooksContext.Provider
      value={{ books, addBook, moveBook, deleteBook, updateDates, updateComment, isLoading, error, reload }}
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
