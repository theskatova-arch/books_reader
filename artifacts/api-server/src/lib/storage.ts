import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "booktracker.json");

export interface UserRecord {
  id: string;
  username: string;
  hash: string;
  salt: string;
}

export type BookStatus = "want-to-read" | "reading" | "read";

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  addedAt: number;
  startedReadingAt?: number;
  finishedAt?: number;
  comment?: string;
  coverUrl?: string;
  genre?: string;
}

interface DataStore {
  users: Record<string, UserRecord>;
  books: Record<string, BookRecord[]>;
}

function load(): DataStore {
  try {
    if (!fs.existsSync(DATA_FILE)) return { users: {}, books: {} };
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as DataStore;
  } catch {
    return { users: {}, books: {} };
  }
}

function save(data: DataStore): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function findUserByUsername(username: string): UserRecord | null {
  const data = load();
  return (
    Object.values(data.users).find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    ) ?? null
  );
}

export function findUserById(id: string): UserRecord | null {
  const data = load();
  return data.users[id] ?? null;
}

export function createUser(user: UserRecord): void {
  const data = load();
  data.users[user.id] = user;
  data.books[user.id] = [];
  save(data);
}

export function getBooks(userId: string): BookRecord[] {
  const data = load();
  return data.books[userId] ?? [];
}

export function saveBooks(userId: string, books: BookRecord[]): void {
  const data = load();
  data.books[userId] = books;
  save(data);
}
