import { Router, type IRouter } from "express";
import crypto from "crypto";
import { authenticate } from "../middlewares/authenticate.js";
import { getBooks, saveBooks, type BookRecord } from "../lib/storage.js";

const router: IRouter = Router();

router.use(authenticate);

// GET /api/books — list all books for the authenticated user
router.get("/", (req, res) => {
  const books = getBooks(req.user!.userId);
  res.json(books);
});

// POST /api/books — create a new book
router.post("/", (req, res) => {
  const { title, author, status, addedAt, startedReadingAt, finishedAt, coverUrl, genre } =
    req.body as Partial<BookRecord>;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Название книги обязательно" });
    return;
  }

  const validStatuses = ["want-to-read", "reading", "read"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Недопустимый статус книги" });
    return;
  }

  const book: BookRecord = {
    id: crypto.randomUUID(),
    title: title.trim(),
    author: typeof author === "string" ? author.trim() : "",
    status,
    addedAt: typeof addedAt === "number" ? addedAt : Date.now(),
    startedReadingAt:
      typeof startedReadingAt === "number" ? startedReadingAt : undefined,
    finishedAt: typeof finishedAt === "number" ? finishedAt : undefined,
    coverUrl: typeof coverUrl === "string" && coverUrl.trim().length > 0 ? coverUrl.trim() : undefined,
    genre: typeof genre === "string" && genre.trim().length > 0 ? genre.trim() : undefined,
  };

  const books = getBooks(req.user!.userId);
  books.unshift(book);
  saveBooks(req.user!.userId, books);

  res.status(201).json(book);
});

// PUT /api/books/:id — update a book
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const books = getBooks(req.user!.userId);
  const idx = books.findIndex((b) => b.id === id);

  if (idx === -1) {
    res.status(404).json({ error: "Книга не найдена" });
    return;
  }

  const updates = req.body as Partial<BookRecord & { comment: string | null }>;
  const scalarKeys: (keyof BookRecord)[] = [
    "title",
    "author",
    "status",
    "startedReadingAt",
    "finishedAt",
  ];

  const updated: BookRecord = { ...books[idx]! };
  for (const key of scalarKeys) {
    if (key in updates) {
      // @ts-expect-error dynamic assignment
      updated[key] = updates[key];
    }
  }

  // Handle coverUrl separately, mirroring POST's validation: null or empty
  // string clears it; a non-empty string is trimmed; anything else (wrong
  // type) is rejected rather than silently stored.
  if ("coverUrl" in updates) {
    const raw = updates.coverUrl;
    if (raw === null || raw === "" || raw === undefined) {
      delete updated.coverUrl;
    } else if (typeof raw === "string") {
      updated.coverUrl = raw.trim();
    } else {
      res.status(400).json({ error: "Обложка должна быть строкой" });
      return;
    }
  }

  // Handle genre separately: null or empty string clears it; non-empty string is trimmed.
  if ("genre" in updates) {
    const raw = (updates as Partial<BookRecord & { genre: string | null }>).genre;
    if (raw === null || raw === "" || raw === undefined) {
      delete updated.genre;
    } else if (typeof raw === "string") {
      updated.genre = raw.trim();
    } else {
      res.status(400).json({ error: "Жанр должен быть строкой" });
      return;
    }
  }

  // Handle comment separately: null or empty string clears it; otherwise validate and trim.
  if ("comment" in updates) {
    const raw = updates.comment;
    if (raw === null || raw === "" || raw === undefined) {
      delete updated.comment;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 500) {
        res.status(400).json({ error: "Отзыв не должен превышать 500 символов" });
        return;
      }
      updated.comment = trimmed;
    } else {
      res.status(400).json({ error: "Отзыв должен быть строкой" });
      return;
    }
  }

  books[idx] = updated;
  saveBooks(req.user!.userId, books);

  res.json(updated);
});

// DELETE /api/books/:id — delete a book
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const books = getBooks(req.user!.userId);
  const filtered = books.filter((b) => b.id !== id);

  if (filtered.length === books.length) {
    res.status(404).json({ error: "Книга не найдена" });
    return;
  }

  saveBooks(req.user!.userId, filtered);
  res.status(204).send();
});

export default router;
