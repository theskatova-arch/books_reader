import { useEffect, useRef, useState } from 'react';
import { resolveCyrillicAuthor } from '@/hooks/useOpenLibraryBooks';

interface EditionDoc {
  title?: string;
}

interface SuggestionDoc {
  key: string;
  title: string;
  author_name?: string[];
  author_alternative_name?: string[];
  cover_i?: number;
  editions?: { docs: EditionDoc[] };
}

export interface BookSuggestion {
  key: string;
  title: string;
  author: string;
  coverId: number | null;
}

const EDITIONS_PARAMS = 'editions.language=rus&editions.limit=1';
const FIELDS =
  'key,title,author_name,author_alternative_name,cover_i,editions';

function resolveTitle(doc: SuggestionDoc): string {
  return doc.editions?.docs?.[0]?.title ?? doc.title;
}

/**
 * Searches Open Library as the user types, returning up to 8 suggestions.
 * Debounces 350 ms and cancels stale requests. No language filter so any
 * book (Russian, English, etc.) can be found and added to the shelf.
 * Titles use the Russian edition title when available; author names use a
 * Cyrillic alternative when OL provides one.
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
          `&fields=${FIELDS}&${EDITIONS_PARAMS}&limit=8`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`OL ${res.status}`);
        const data: { docs: SuggestionDoc[] } = await res.json();
        if (!isMounted.current || controller.signal.aborted) return;
        setBooks(
          data.docs.map((doc) => ({
            key: doc.key,
            title: resolveTitle(doc),
            author: resolveCyrillicAuthor(doc.author_name, doc.author_alternative_name),
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
