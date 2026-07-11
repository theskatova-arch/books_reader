import { useCallback, useEffect, useRef, useState } from 'react';
import type { LibraryGenre } from '@/constants/libraryGenres';

export interface OpenLibraryBook {
  key: string;
  title: string;
  author: string;
  coverId: number | null;
  firstPublishYear: number | null;
  /** Filtered subject tags from Open Library (up to 5). */
  subjects: string[];
}

export interface LibrarySearchParams {
  title: string;
  author: string;
  genre: LibraryGenre;
}

const PAGE_SIZE = 20;
// Strict filter baked into the query itself, per Open Library's own
// convention (e.g. "война и мир language:rus") — excludes works that
// have no Russian edition, rather than just biasing ranking.
// Uses the broader "fiction" subject (not "Russian fiction") so foreign
// authors with a Russian translation are included alongside Russian ones.
const QUERY = 'subject:fiction language:rus';

// Open Library's search index returns each work's canonical title (often
// the original English/foreign title) even when a Russian edition exists.
// The nested "editions" sub-request below asks for one edition per work
// filtered to language:rus, whose title is the actual Russian (translated)
// title we want to display.
const EDITIONS_PARAMS = 'editions.language=rus&editions.limit=1';

// Some Russian editions in Open Library's catalog are only cataloged with a
// transliterated (Latin-script) title rather than a Cyrillic one. As a
// strict client-side backstop, drop any result whose resolved title has no
// Cyrillic characters at all.
const CYRILLIC_RE = /[\u0400-\u04FF]/;

interface EditionDoc {
  key: string;
  title: string;
}

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  author_alternative_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  editions?: { docs: EditionDoc[] };
}

const SUBJECT_NOISE = [
  /reading level/i,
  /grade \d/i,
  /open library/i,
  /long now/i,
  /nouvelles/i,
  /novela/i,
  /syllabus/i,
  /accessible book/i,
  /protected daisy/i,
  /in library/i,
  /\d{4}/,
  /^general$/i,
  /^readers?$/i,
  /^adaptations$/i,
  /^dictionaries$/i,
  /^study guides$/i,
  /^literary$/i,
];

function filterSubjects(raw: string[]): string[] {
  return raw
    .filter((s) => s.length <= 45 && !SUBJECT_NOISE.some((p) => p.test(s)))
    .slice(0, 5);
}

interface SearchResponse {
  numFound: number;
  docs: SearchDoc[];
}

function resolveTitle(doc: SearchDoc): string {
  return doc.editions?.docs?.[0]?.title ?? doc.title;
}

/**
 * Returns a Cyrillic author name when one is available.
 * - Russian/Ukrainian authors: OL stores the canonical name in Cyrillic already.
 * - Western authors: falls back to `author_alternative_name` entries that
 *   contain Cyrillic characters, then to the canonical Latin name.
 */
export function resolveCyrillicAuthor(
  authorName: string[] | undefined,
  altNames: string[] | undefined,
): string {
  const canonical = authorName?.[0] ?? '';
  if (CYRILLIC_RE.test(canonical)) return canonical;
  const cyrillicAlt = altNames?.find((n) => CYRILLIC_RE.test(n));
  return cyrillicAlt ?? canonical;
}

function toBook(doc: SearchDoc): OpenLibraryBook {
  return {
    key: doc.key,
    title: resolveTitle(doc),
    author: resolveCyrillicAuthor(doc.author_name, doc.author_alternative_name),
    coverId: doc.cover_i ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
    subjects: filterSubjects(doc.subject ?? []),
  };
}

const FIELDS =
  'key,title,author_name,author_alternative_name,cover_i,first_publish_year,subject,editions';

/**
 * Looks up subject tags for any book by title and author via Open Library
 * search. Used by the room random picker for books that were not sourced
 * from the Library screen and therefore carry no OL subjects yet.
 */
export async function fetchSubjectsByTitleAuthor(
  title: string,
  author: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = author.trim()
    ? `${title.trim()} author:"${author.trim()}" language:rus`
    : `${title.trim()} language:rus`;
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=subject&limit=3`;
  try {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) return [];
    const data: { docs: { subject?: string[] }[] } = await res.json();
    for (const doc of data.docs) {
      const filtered = filterSubjects(doc.subject ?? []);
      if (filtered.length > 0) return filtered;
    }
    return [];
  } catch {
    return [];
  }
}

// Open Library's search endpoint refuses to page arbitrarily deep into a
// result set; cap how far we'll jump so a huge numFound doesn't produce a
// page number the API rejects or times out on.
const MAX_RANDOM_PAGE = 800;

/**
 * Picks one random book from across the *entire* Open Library catalog that
 * matches our Russian-fiction query — not just the books already loaded
 * into the paginated list. Jumps to a random page of the search index, then
 * picks a random Cyrillic-titled result from that page, skipping any whose
 * key is in `excludeKeys` (already added / recently shown). Retries a few
 * times with a different random page if a page turns out to have no usable
 * results after filtering.
 */
export async function pickRandomLibraryBook(
  excludeKeys: Set<string> = new Set(),
): Promise<OpenLibraryBook | null> {
  let numFound: number | null = null;

  const attempts = 5;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      if (numFound == null) {
        const countUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
          QUERY,
        )}&limit=1&fields=key`;
        const countRes = await fetch(countUrl);
        if (!countRes.ok) throw new Error(`Open Library вернул ошибку ${countRes.status}`);
        const countData: SearchResponse = await countRes.json();
        numFound = countData.numFound;
      }
      if (!numFound || numFound <= 0) return null;

      const maxPage = Math.min(Math.ceil(numFound / PAGE_SIZE), MAX_RANDOM_PAGE);
      const page = 1 + Math.floor(Math.random() * maxPage);

      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
        QUERY,
      )}&page=${page}&limit=${PAGE_SIZE}&fields=${FIELDS}&${EDITIONS_PARAMS}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open Library вернул ошибку ${res.status}`);
      const data: SearchResponse = await res.json();

      const candidates = data.docs
        .filter((doc) => CYRILLIC_RE.test(resolveTitle(doc)) && !excludeKeys.has(doc.key))
        .map(toBook);
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)]!;
      }
      // This page had no usable results after filtering — try another
      // random page rather than giving up immediately.
    } catch {
      // Network/parse error on this attempt — fall through and retry, so a
      // single flaky request doesn't fail the whole pick.
    }
  }

  return null;
}

function buildSearchQuery(params: LibrarySearchParams): string {
  const parts: string[] = [];
  if (params.title.trim()) parts.push(params.title.trim());
  if (params.author.trim()) parts.push(params.author.trim());
  if (params.genre.subject) parts.push(`subject:"${params.genre.subject}"`);
  parts.push('language:rus');
  return parts.join(' ');
}

/**
 * Searches the Open Library catalog by structured params (title, author,
 * genre). Pass null to skip fetching entirely (browse mode).
 * Search fires immediately when params change — no debounce, since the
 * query is triggered by explicit form submission, not keystroke-by-keystroke.
 */
export function useOpenLibrarySearch(params: LibrarySearchParams | null) {
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const isMounted = useRef(true);
  const requestTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Stable ref so fetchPage callback doesn't re-create on every params change
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchPage = useCallback(async (nextPage: number, token: number) => {
    const currentParams = paramsRef.current;
    if (!currentParams) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
        buildSearchQuery(currentParams),
      )}&page=${nextPage}&limit=${PAGE_SIZE}&fields=${FIELDS}&${EDITIONS_PARAMS}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Open Library вернул ошибку ${res.status}`);
      const data: SearchResponse = await res.json();
      if (!isMounted.current || requestTokenRef.current !== token) return;

      const newBooks = data.docs
        .filter((doc) => CYRILLIC_RE.test(resolveTitle(doc)))
        .map(toBook);
      setBooks((prev) => {
        if (nextPage === 1) return newBooks;
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...newBooks.filter((b) => !seen.has(b.key))];
      });
      setPage(nextPage);
      setHasMore(data.docs.length === PAGE_SIZE && nextPage * PAGE_SIZE < data.numFound);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      if (!isMounted.current || requestTokenRef.current !== token) return;
      setError(e instanceof Error ? e.message : 'Не удалось найти книги');
    } finally {
      if (isMounted.current && requestTokenRef.current === token) setLoading(false);
    }
  }, []);

  // Fire immediately on params change; reset to page 1 for every new search.
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

/**
 * Loads books from the Open Library search API one page (20 books) at a
 * time. Call `loadMore()` when the user scrolls near the bottom to fetch
 * the next page; results are appended to the existing list.
 */
export function useOpenLibraryBooks() {
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Guards against overlapping requests (e.g. rapid scroll firing
  // onEndReached multiple times before a request resolves), and against
  // re-requesting the same page while it's already in flight.
  const inFlight = useRef(false);
  const lastRequestedPage = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPage = useCallback(async (nextPage: number) => {
    if (inFlight.current || lastRequestedPage.current === nextPage) return;
    inFlight.current = true;
    lastRequestedPage.current = nextPage;
    setLoading(true);
    setError(null);

    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
        QUERY,
      )}&sort=rating&page=${nextPage}&limit=${PAGE_SIZE}&fields=${FIELDS}&${EDITIONS_PARAMS}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open Library вернул ошибку ${res.status}`);
      const data: SearchResponse = await res.json();
      if (!isMounted.current) return;

      const newBooks = data.docs
        .filter((doc) => CYRILLIC_RE.test(resolveTitle(doc)))
        .map(toBook);
      setBooks((prev) => {
        if (nextPage === 1) return newBooks;
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...newBooks.filter((b) => !seen.has(b.key))];
      });
      setPage(nextPage);
      // Base "hasMore" on the raw (unfiltered) page size — the Cyrillic
      // filter above can shrink a page below PAGE_SIZE even when Open
      // Library still has more underlying results to page through.
      setHasMore(data.docs.length === PAGE_SIZE && nextPage * PAGE_SIZE < data.numFound);
    } catch (e) {
      if (!isMounted.current) return;
      setError(e instanceof Error ? e.message : 'Не удалось загрузить книги');
      // Allow retrying the same page after a failure.
      lastRequestedPage.current = nextPage - 1;
    } finally {
      if (isMounted.current) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPage(page + 1);
  }, [loading, hasMore, page, fetchPage]);

  const retry = useCallback(() => {
    if (books.length === 0) {
      fetchPage(1);
    } else {
      loadMore();
    }
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
