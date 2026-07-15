/**
 * Google Books API integration.
 * Replaces the former Open Library hooks — all export names are kept
 * identical so callers need no changes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LibraryGenre } from '@/constants/libraryGenres';

export interface OpenLibraryBook {
  key: string;           // Google Books volumeId
  title: string;
  author: string;
  coverUrl: string | null;  // direct HTTPS URL from imageLinks.thumbnail
  firstPublishYear: number | null;
  subjects: string[];
}

export interface LibrarySearchParams {
  title: string;
  author: string;
  genre: LibraryGenre;
}

const PAGE_SIZE = 20;
const BASE = 'https://www.googleapis.com/books/v1/volumes';

// ─── Response types ────────────────────────────────────────────────────────

interface VolumeInfo {
  title?: string;
  authors?: string[];
  publishedDate?: string;
  categories?: string[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
}

interface Volume {
  id: string;
  volumeInfo: VolumeInfo;
}

interface SearchResponse {
  totalItems?: number;
  items?: Volume[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function coverUrl(info: VolumeInfo): string | null {
  const raw = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  if (!raw) return null;
  // Google returns http; force https and bump zoom for better quality
  return raw.replace(/^http:/, 'https:').replace('&zoom=1', '&zoom=2');
}

function firstYear(info: VolumeInfo): number | null {
  const y = parseInt((info.publishedDate ?? '').slice(0, 4), 10);
  return isNaN(y) ? null : y;
}

function toBook(v: Volume): OpenLibraryBook {
  const info = v.volumeInfo;
  return {
    key: v.id,
    title: info.title ?? '—',
    author: info.authors?.[0] ?? '',
    coverUrl: coverUrl(info),
    firstPublishYear: firstYear(info),
    subjects: (info.categories ?? []).slice(0, 5),
  };
}

function buildQuery(params: LibrarySearchParams): string {
  const parts: string[] = [];
  if (params.title.trim()) parts.push(`intitle:${params.title.trim()}`);
  if (params.author.trim()) parts.push(`inauthor:${params.author.trim()}`);
  if (params.genre.subject) parts.push(`subject:${params.genre.subject}`);
  if (parts.length === 0) parts.push('subject:fiction');
  return parts.join('+');
}

async function fetchVolumes(
  q: string,
  startIndex: number,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const url =
    `${BASE}?q=${encodeURIComponent(q)}` +
    `&langRestrict=ru` +
    `&maxResults=${PAGE_SIZE}` +
    `&startIndex=${startIndex}` +
    `&printType=books` +
    `&orderBy=relevance`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`Google Books вернул ошибку ${res.status}`);
  return res.json() as Promise<SearchResponse>;
}

// ─── fetchSubjectsByTitleAuthor ────────────────────────────────────────────
// Used by RandomPickerModal to enrich a user's local book with tags.

export async function fetchSubjectsByTitleAuthor(
  title: string,
  author: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    const q = author.trim()
      ? `intitle:${title.trim()}+inauthor:${author.trim()}`
      : `intitle:${title.trim()}`;
    const url = `${BASE}?q=${encodeURIComponent(q)}&maxResults=3&printType=books`;
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) return [];
    const data = (await res.json()) as SearchResponse;
    for (const vol of data.items ?? []) {
      const cats = (vol.volumeInfo.categories ?? []).slice(0, 5);
      if (cats.length > 0) return cats;
    }
    return [];
  } catch {
    return [];
  }
}

// ─── pickRandomLibraryBook ────────────────────────────────────────────────
// Picks a random Russian-language book from Google Books.

const MAX_OFFSET = 800;

export async function pickRandomLibraryBook(
  excludeKeys: Set<string> = new Set(),
): Promise<OpenLibraryBook | null> {
  const queries = [
    'subject:fiction',
    'subject:classics',
    'subject:fantasy',
    'subject:detective',
  ];

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const q = queries[Math.floor(Math.random() * queries.length)]!;
      const startIndex = Math.floor(Math.random() * MAX_OFFSET);
      const data = await fetchVolumes(q, startIndex);
      const candidates = (data.items ?? [])
        .map(toBook)
        .filter((b) => b.title !== '—' && !excludeKeys.has(b.key));
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)]!;
      }
    } catch {
      // retry
    }
  }
  return null;
}

// ─── useOpenLibrarySearch ─────────────────────────────────────────────────

export function useOpenLibrarySearch(params: LibrarySearchParams | null) {
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const isMounted = useRef(true);
  const requestTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => () => { isMounted.current = false; abortRef.current?.abort(); }, []);

  const fetchPage = useCallback(async (nextPage: number, token: number) => {
    const currentParams = paramsRef.current;
    if (!currentParams) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const startIndex = (nextPage - 1) * PAGE_SIZE;
      const data = await fetchVolumes(
        buildQuery(currentParams),
        startIndex,
        controller.signal,
      );
      if (!isMounted.current || requestTokenRef.current !== token) return;

      const newBooks = (data.items ?? []).map(toBook);
      setBooks((prev) => {
        if (nextPage === 1) return newBooks;
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...newBooks.filter((b) => !seen.has(b.key))];
      });
      setPage(nextPage);
      const total = data.totalItems ?? 0;
      setHasMore(newBooks.length === PAGE_SIZE && nextPage * PAGE_SIZE < total);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      if (!isMounted.current || requestTokenRef.current !== token) return;
      setError(e instanceof Error ? e.message : 'Не удалось найти книги');
    } finally {
      if (isMounted.current && requestTokenRef.current === token) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!params) {
      requestTokenRef.current += 1;
      abortRef.current?.abort();
      setBooks([]);
      setPage(0);
      setError(null);
      setHasMore(true);
      setLoading(false);
      return;
    }
    const token = ++requestTokenRef.current;
    setBooks([]);
    setPage(0);
    setHasMore(true);
    fetchPage(1, token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || !params) return;
    fetchPage(page + 1, requestTokenRef.current);
  }, [loading, hasMore, params, page, fetchPage]);

  const retry = useCallback(() => {
    if (!params) return;
    const token = ++requestTokenRef.current;
    fetchPage(page === 0 ? 1 : page + 1, token);
  }, [params, page, fetchPage]);

  return {
    books,
    loading: loading && books.length === 0,
    loadingMore: loading && books.length > 0,
    error,
    hasMore,
    loadMore,
    retry,
  };
}

// ─── useOpenLibraryBooks ──────────────────────────────────────────────────
// Browse mode: loads popular Russian books on mount, paginates on scroll.

export function useOpenLibraryBooks() {
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const inFlight = useRef(false);
  const lastRequestedPage = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchPage = useCallback(async (nextPage: number) => {
    if (inFlight.current || lastRequestedPage.current === nextPage) return;
    inFlight.current = true;
    lastRequestedPage.current = nextPage;
    setLoading(true);
    setError(null);

    try {
      const startIndex = (nextPage - 1) * PAGE_SIZE;
      const data = await fetchVolumes('subject:fiction', startIndex);
      if (!isMounted.current) return;

      const newBooks = (data.items ?? []).map(toBook);
      setBooks((prev) => {
        if (nextPage === 1) return newBooks;
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...newBooks.filter((b) => !seen.has(b.key))];
      });
      setPage(nextPage);
      const total = data.totalItems ?? 0;
      setHasMore(newBooks.length === PAGE_SIZE && nextPage * PAGE_SIZE < total);
    } catch (e) {
      if (!isMounted.current) return;
      setError(e instanceof Error ? e.message : 'Не удалось загрузить книги');
      lastRequestedPage.current = nextPage - 1;
    } finally {
      if (isMounted.current) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPage(page + 1);
  }, [loading, hasMore, page, fetchPage]);

  const retry = useCallback(() => {
    if (books.length === 0) fetchPage(1);
    else loadMore();
  }, [books.length, fetchPage, loadMore]);

  return {
    books,
    loading: loading && books.length === 0,
    loadingMore: loading && books.length > 0,
    error,
    hasMore,
    loadMore,
    retry,
  };
}
