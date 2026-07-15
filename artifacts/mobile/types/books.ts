export type BookStatus = 'want-to-read' | 'reading' | 'read';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  addedAt: number;
  startedReadingAt?: number;
  finishedAt?: number;
  /** Optional reader's note left after finishing the book */
  comment?: string;
  /** Cover image URL, when known (e.g. picked from the Library). */
  coverUrl?: string;
  /** Personal rating 1-5, set by the authenticated user. */
  rating?: number | null;
}
