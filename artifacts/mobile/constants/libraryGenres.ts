/** Genres shown in the Library search form.
 *  `subject` is the Open Library subject tag used in the search query.
 *  null means "no subject filter" (Любой). */
export interface LibraryGenre {
  label: string;
  subject: string | null;
}

export const LIBRARY_GENRES: LibraryGenre[] = [
  { label: 'Любой', subject: null },
  { label: 'Классика', subject: 'Classics' },
  { label: 'Художественная литература', subject: 'Fiction' },
  { label: 'Фантастика', subject: 'Science fiction' },
  { label: 'Фэнтези', subject: 'Fantasy fiction' },
  { label: 'Антиутопия', subject: 'Dystopian fiction' },
  { label: 'Детектив / Триллер', subject: 'Detective and mystery stories' },
  { label: 'Исторический роман', subject: 'Historical fiction' },
  { label: 'Приключения', subject: 'Adventure stories' },
  { label: 'Ужасы', subject: 'Horror' },
  { label: 'Романтика', subject: 'Love stories' },
  { label: 'Психологическая проза', subject: 'Psychological fiction' },
  { label: 'Для детей', subject: 'Juvenile fiction' },
];
