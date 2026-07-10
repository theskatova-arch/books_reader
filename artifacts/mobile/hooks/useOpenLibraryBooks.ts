import { useCallback, useEffect, useRef, useState } from 'react';

export interface OpenLibraryBook {
  key: string;
  title: string;
  author: string;
  coverId: number | null;
  firstPublishYear: number | null;
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
  cover_i?: number;
  first_publish_year?: number;
  editions?: { docs: EditionDoc[] };
}

interface SearchResponse {
  numFound: number;
  docs: SearchDoc[];
}

function resolveTitle(doc: SearchDoc): string {
  return doc.editions?.docs?.[0]?.title ?? doc.title;
}

function toBook(doc: SearchDoc): OpenLibraryBook {
  return {
    key: doc.key,
    title: resolveTitle(doc),
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
      )}&sort=rating&page=${nextPage}&limit=${PAGE_SIZE}&fields=key,title,author_name,cover_i,first_publish_year,editions&${EDITIONS_PARAMS}`;
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
