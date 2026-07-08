---
name: Book comment feature
description: Notes on the comment/review feature added to finished books, and a null-clearing bug that was fixed.
---

## Rule
When clearing an optional field via API, always send an explicit `null` in JSON — never rely on `undefined` (which JSON.stringify drops entirely).

**Why:** `booksApi.update(id, { comment: null ?? undefined })` serializes to `{}`, so the server never sees the comment key and ignores the clear. Fixed by passing `comment` directly (allowing `null`).

**How to apply:** Any future "clear" operation on a nullable field must use `null` in the payload, not `undefined`. The server normalises `null | ""` → delete the field.

## Server-side comment handling (routes/books.ts)
- `null` or `""` → `delete updated.comment`
- Non-empty string → trim + reject if > 500 chars
- Non-string → 400 error
