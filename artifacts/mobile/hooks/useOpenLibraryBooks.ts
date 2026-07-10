import { useCallback, useEffect, useRef, useState } from 'react';

export interface OpenLibraryBook {
  key: string;
  title: string;
  author: string;
  coverId: number | null;
  firstPublishYear: number | null;
}

const PAGE_SIZE = 20;
// Restricts results to Russian-language fiction so titles/authors render
// in Russian by default (plain "&lang=ru" only affects ranking, not the
// language of the returned titles).
const QUERY = 'subject:"Russian fiction"';

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

interface SearchResponse {
  numFound: number;
  docs: SearchDoc[];
}

function toBook(doc: SearchDoc): OpenLibraryBook {
  return {
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? '',
    coverId: doc.cover_i ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
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
      )}&lang=ru&sort=rating&page=${nextPage}&limit=${PAGE_SIZE}&fields=key,title,author_name,cover_i,first_publish_year`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open Library вернул ошибку ${res.status}`);
      const data: SearchResponse = await res.json();
      if (!isMounted.current) return;

      const newBooks = data.docs.map(toBook);
      setBooks((prev) => {
        if (nextPage === 1) return newBooks;
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...newBooks.filter((b) => !seen.has(b.key))];
      });
      setPage(nextPage);
      setHasMore(newBooks.length === PAGE_SIZE && nextPage * PAGE_SIZE < data.numFound);
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
