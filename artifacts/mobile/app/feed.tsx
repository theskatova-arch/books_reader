import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BackToHomeButton } from '@/components/BackToHomeButton';
import { apiJSON } from '@/lib/api';
import type { BookStatus } from '@/types/books';
import { useBooks } from '@/context/BooksContext';
import { useAuth } from '@/context/AuthContext';

interface FeedBook {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  coverUrl?: string;
}

interface FeedEntry {
  username: string;
  books: FeedBook[];
}

const STATUS_ORDER: BookStatus[] = ['reading', 'want-to-read', 'read'];

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: 'Читает',
  read: 'Прочитано',
  'want-to-read': 'Хочет прочитать',
};

const STATUS_COLORS: Record<BookStatus, string> = {
  reading: '#22c55e',
  read: '#3b82f6',
  'want-to-read': '#f59e0b',
};

function pluralBooks(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return `${n} книг`;
  if (m10 === 1) return `${n} книга`;
  if (m10 >= 2 && m10 <= 4) return `${n} книги`;
  return `${n} книг`;
}

// ─── Book row inside the modal ────────────────────────────────────────────────

function BookRow({
  book,
  colors,
  onAdd,
  added,
}: {
  book: FeedBook;
  colors: ReturnType<typeof useColors>;
  onAdd?: () => void;
  added?: boolean;
}) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={rowStyles.cover} resizeMode="cover" />
      ) : (
        <View style={[rowStyles.cover, rowStyles.coverPlaceholder, { backgroundColor: colors.secondary }]}>
          <Text style={rowStyles.coverEmoji}>📖</Text>
        </View>
      )}
      <View style={rowStyles.info}>
        <Text style={[rowStyles.title, { color: colors.foreground }]} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text style={[rowStyles.author, { color: colors.mutedForeground }]} numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
      </View>
      {onAdd && (
        <TouchableOpacity
          style={[
            rowStyles.addBtn,
            { backgroundColor: added ? colors.secondary : colors.primary, borderRadius: 16 },
          ]}
          onPress={added ? undefined : onAdd}
          activeOpacity={added ? 1 : 0.7}
          hitSlop={8}
        >
          <Ionicons
            name={added ? 'checkmark' : 'add'}
            size={18}
            color={added ? colors.mutedForeground : '#fff'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cover: { width: 38, height: 54, borderRadius: 4 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 14 },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
  author: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  addBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

// ─── Reader card (collapsed) ──────────────────────────────────────────────────

function ReaderCard({
  entry,
  onPress,
  colors,
}: {
  entry: FeedEntry;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[cardStyles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={cardStyles.avatarText}>{entry.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={cardStyles.info}>
        <Text style={[cardStyles.username, { color: colors.foreground }]}>{entry.username}</Text>
        <Text style={[cardStyles.count, { color: colors.mutedForeground }]}>
          {pluralBooks(entry.books.length)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  info: { flex: 1 },
  username: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
});

// ─── Reader detail modal ──────────────────────────────────────────────────────

function ReaderModal({
  entry,
  visible,
  onClose,
  colors,
  bottomInset,
}: {
  entry: FeedEntry | null;
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  bottomInset: number;
}) {
  const { user } = useAuth();
  const { addBook } = useBooks();
  // ids of books added this session
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // reset when modal closes
  useEffect(() => { if (!visible) setAddedIds(new Set()); }, [visible]);

  const handleAdd = useCallback(async (book: FeedBook) => {
    setAddedIds((prev) => new Set(prev).add(book.id));
    try {
      await addBook(book.title, book.author ?? '', 'want-to-read', book.coverUrl);
    } catch {
      // revert on failure
      setAddedIds((prev) => { const s = new Set(prev); s.delete(book.id); return s; });
    }
  }, [addBook]);

  const grouped = (entry?.books ?? [])
    .reduce<Partial<Record<BookStatus, FeedBook[]>>>((acc, b) => {
      (acc[b.status] ??= []).push(b);
      return acc;
    }, {});

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* full-screen container: backdrop behind, sheet at bottom */}
      <View style={modalStyles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.card, paddingBottom: bottomInset + 16 }]}>
          {/* Handle */}
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: colors.border }]}>
            <View style={[modalStyles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={modalStyles.avatarText}>
                {entry?.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.username, { color: colors.foreground }]}>{entry?.username}</Text>
              <Text style={[modalStyles.subtitle, { color: colors.mutedForeground }]}>
                {pluralBooks(entry?.books.length ?? 0)} на полке
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Book lists */}
          <ScrollView
            contentContainerStyle={modalStyles.content}
            showsVerticalScrollIndicator={false}
          >
            {STATUS_ORDER.filter((s) => (grouped[s]?.length ?? 0) > 0).map((status) => (
              <View key={status} style={modalStyles.section}>
                <View style={[modalStyles.sectionBadge, { backgroundColor: STATUS_COLORS[status] + '22' }]}>
                  <Text style={[modalStyles.sectionLabel, { color: STATUS_COLORS[status] }]}>
                    {STATUS_LABELS[status]}
                  </Text>
                  <Text style={[modalStyles.sectionCount, { color: STATUS_COLORS[status] }]}>
                    {grouped[status]!.length}
                  </Text>
                </View>
                {grouped[status]!.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    colors={colors}
                    onAdd={user ? () => handleAdd(book) : undefined}
                    added={addedIds.has(book.id)}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  username: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 1 },
  content: { paddingVertical: 8, gap: 20 },
  section: { gap: 0 },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiJSON<FeedEntry[]>('/api/feed');
      setEntries(data.filter((e) => e.books.length > 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить ленту');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BackToHomeButton topPad={topPad} />

      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Лента читателей</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Не удалось загрузить</Text>
          <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}
          >
            <Text style={[styles.retryLabel, { color: colors.primaryForeground }]}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Пока никого нет</Text>
          <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
            Зарегистрируйся и добавь книги — они появятся здесь
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <ReaderCard entry={item} onPress={() => setSelected(item)} colors={colors} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      <ReaderModal
        entry={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
        colors={colors}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  list: { paddingTop: 12, paddingHorizontal: 16 },
  emoji: { fontSize: 48, marginBottom: 8 },
  stateTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  stateText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  retryBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24 },
  retryLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
