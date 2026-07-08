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
}
