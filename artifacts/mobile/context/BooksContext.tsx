import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BookStatus = 'want-to-read' | 'reading' | 'read';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  addedAt: number;
}

interface BooksContextType {
  books: Book[];
  addBook: (title: string, author: string, status: BookStatus) => void;
  moveBook: (id: string, newStatus: BookStatus) => void;
  deleteBook: (id: string) => void;
  isLoading: boolean;
}

const BooksContext = createContext<BooksContextType | null>(null);

const STORAGE_KEY = '@books_tracker_v1';

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setBooks(JSON.parse(data));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback((next: Book[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const addBook = useCallback(
    (title: string, author: string, status: BookStatus) => {
      const book: Book = {
        id:
          Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: title.trim(),
        author: author.trim(),
        status,
        addedAt: Date.now(),
      };
      setBooks((prev) => {
        const next = [book, ...prev];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const moveBook = useCallback(
    (id: string, newStatus: BookStatus) => {
      setBooks((prev) => {
        const next = prev.map((b) =>
          b.id === id ? { ...b, status: newStatus } : b,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const deleteBook = useCallback(
    (id: string) => {
      setBooks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return (
    <BooksContext.Provider
      value={{ books, addBook, moveBook, deleteBook, isLoading }}
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
