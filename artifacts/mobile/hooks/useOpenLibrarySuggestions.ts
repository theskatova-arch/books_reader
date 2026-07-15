/**
 * Google Books typeahead suggestions.
 * Replaces the former Open Library suggestions hook.
 * Export names are kept identical.
 */
import { useEffect, useRef, useState } from 'react';

export interface BookSuggestion {
  key: string;        // Google Books volumeId
  title: string;
  author: string;
  coverUrl: string | null;
}

interface VolumeInfo {
  title?: string;
  authors?: string[];
  imageLinks?: { smallThumbnail?: string; thumbnail?: string };
}

interface Volume {
  id: string;
  volumeInfo: VolumeInfo;
}

function coverUrl(info: VolumeInfo): string | null {
  const raw = info.imageLinks?.smallThumbnail ?? info.imageLinks?.thumbnail;
  if (!raw) return null;
  return raw.replace(/^http:/, 'https:');
}

/**
 * Searches Google Books as the user types, returning up to 8 suggestions.
 * Debounces 350 ms and cancels stale requests.
 */
export function useOpenLibrarySuggestions(query: string) {
  const trimmed = query.trim();
  const [books, setBooks] = useState<BookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => () => {
    isMounted.current = false;
    abortRef.current?.abort();
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
        const q = encodeURIComponent(trimmed);
        const url =
          `https://www.googleapis.com/books/v1/volumes` +
          `?q=${q}&langRestrict=ru&maxResults=8&printType=books`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Google Books ${res.status}`);
        const data = (await res.json()) as { items?: Volume[] };
        if (!isMounted.current || controller.signal.aborted) return;

        setBooks(
          (data.items ?? []).map((v) => ({
            key: v.id,
            title: v.volumeInfo.title ?? '—',
            author: v.volumeInfo.authors?.[0] ?? '',
            coverUrl: coverUrl(v.volumeInfo),
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
