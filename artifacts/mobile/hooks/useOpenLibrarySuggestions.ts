import { useEffect, useRef, useState } from 'react';

interface SuggestionDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

export interface BookSuggestion {
  key: string;
  title: string;
  author: string;
  coverId: number | null;
}

/**
 * Searches Open Library as the user types, returning up to 8 suggestions.
 * Debounces 350 ms and cancels stale requests. No language filter so any
 * book (Russian, English, etc.) can be found and added to the shelf.
 * Results are suppressed when query is shorter than 2 characters.
 */
export function useOpenLibrarySuggestions(query: string) {
  const trimmed = query.trim();
  const [books, setBooks] = useState<BookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setBooks([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const url =
          `https://openlibrary.org/search.json` +
          `?q=${encodeURIComponent(trimmed)}` +
          `&fields=key,title,author_name,cover_i&limit=8`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`OL ${res.status}`);
        const data: { docs: SuggestionDoc[] } = await res.json();
        if (!isMounted.current || controller.signal.aborted) return;
        setBooks(
          data.docs.map((doc) => ({
            key: doc.key,
            title: doc.title,
            author: doc.author_name?.[0] ?? '',
            coverId: doc.cover_i ?? null,
          })),
        );
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!isMounted.current) return;
        setBooks([]);
      } finally {
        if (isMounted.current && !controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [trimmed]);

  return { books, loading };
}
