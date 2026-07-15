import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BackToHomeButton } from '@/components/BackToHomeButton';
import { apiJSON } from '@/lib/api';
import type { BookStatus } from '@/types/books';

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

const STATUS_LABELS: Record<BookStatus, string> = {
  'reading': 'читает',
  'read': 'прочитал(а)',
  'want-to-read': 'хочет прочитать',
};

const STATUS_COLORS: Record<BookStatus, string> = {
  'reading': '#22c55e',
  'read': '#3b82f6',
  'want-to-read': '#f59e0b',
};

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets.bottom);

  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiJSON<FeedEntry[]>('/api/feed');
      // Only show users who have at least one book
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

  const renderBook = (book: FeedBook) => (
    <View key={book.id} style={[styles.bookRow, { borderColor: colors.border }]}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: colors.secondary }]}>
          <Text style={styles.coverEmoji}>📖</Text>
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[book.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[book.status] }]}>
            {STATUS_LABELS[book.status]}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEntry = ({ item }: { item: FeedEntry }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.username, { color: colors.foreground }]}>
            {item.username}
          </Text>
          <Text style={[styles.bookCount, { color: colors.mutedForeground }]}>
            {item.books.length} {item.books.length === 1 ? 'книга' : item.books.length < 5 ? 'книги' : 'книг'}
          </Text>
        </View>
      </View>
      <View style={styles.booksList}>
        {item.books.slice(0, 5).map(renderBook)}
        {item.books.length > 5 && (
          <Text style={[styles.moreBooks, { color: colors.mutedForeground }]}>
            и ещё {item.books.length - 5}...
          </Text>
        )}
      </View>
    </View>
  );

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
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Не удалось загрузить</Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
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
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Пока никого нет</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Зарегистрируйся и добавь книги — они появятся здесь
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.username}
          renderItem={renderEntry}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, _bottom: number) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: 'Inter_700Bold',
      lineHeight: 32,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 8,
    },
    list: {
      paddingTop: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    card: {
      borderWidth: 1,
      padding: 16,
      gap: 14,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: '#fff',
    },
    username: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
    },
    bookCount: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      marginTop: 1,
    },
    booksList: {
      gap: 8,
    },
    bookRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    cover: {
      width: 40,
      height: 56,
      borderRadius: 4,
    },
    coverPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverEmoji: { fontSize: 16 },
    bookInfo: {
      flex: 1,
      gap: 3,
    },
    bookTitle: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      lineHeight: 18,
    },
    bookAuthor: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    statusText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
    },
    moreBooks: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      paddingTop: 4,
    },
    emoji: { fontSize: 48, marginBottom: 8 },
    errorTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
    errorText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
    retryBtn: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    retryLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
    emptyText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      lineHeight: 21,
    },
  });
}
