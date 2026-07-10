import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useOpenLibraryBooks, OpenLibraryBook } from '@/hooks/useOpenLibraryBooks';
import { useBooks } from '@/context/BooksContext';
import { LibraryBookCard } from '@/components/LibraryBookCard';
import { SearchBar } from '@/components/SearchBar';
import { LibraryRandomPickerModal } from '@/components/LibraryRandomPickerModal';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(colors, insets.top, insets.bottom);

  const { books, loading, loadingMore, error, loadMore, retry } = useOpenLibraryBooks();
  const { addBook } = useBooks();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const displayBooks = searchQuery.trim()
    ? books.filter((b) => {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
        );
      })
    : books;

  const handleAddToWantToRead = (book: OpenLibraryBook) => {
    addBook(book.title, book.author, 'want-to-read');
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.replace('/home')}
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Библиотека</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.border }]}
            onPress={() => setSearchVisible(true)}
            activeOpacity={0.75}
            hitSlop={8}
          >
            <Ionicons name="search-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.border }]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.75}
            hitSlop={8}
            disabled={books.length === 0}
          >
            <Ionicons name="shuffle" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {searchVisible && (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClose={() => { setSearchVisible(false); setSearchQuery(''); }}
        />
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && books.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Не удалось загрузить книги</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.75} onPress={retry}>
            <Text style={styles.retryLabel}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayBooks}
          keyExtractor={(item: OpenLibraryBook) => item.key}
          renderItem={({ item }) => <LibraryBookCard book={item} />}
          contentContainerStyle={[
            styles.listContent,
            displayBooks.length === 0 && styles.centered,
          ]}
          showsVerticalScrollIndicator={false}
          // Loading more only makes sense against the unfiltered feed —
          // while searching we're just filtering what's already loaded.
          onEndReachedThreshold={0.4}
          onEndReached={searchQuery.trim() ? undefined : loadMore}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Ничего не найдено
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Попробуйте другой запрос
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : error ? (
              <TouchableOpacity style={styles.footerRetry} activeOpacity={0.75} onPress={retry}>
                <Text style={styles.footerRetryLabel}>Не удалось загрузить ещё. Повторить</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <LibraryRandomPickerModal
        visible={pickerVisible}
        books={books}
        onAddToWantToRead={handleAddToWantToRead}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  topInset: number,
  bottomInset: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: topInset,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingTop: 80,
    },
    listContent: {
      paddingTop: 8,
      paddingBottom: bottomInset + 16,
    },
    footer: {
      paddingVertical: 20,
    },
    footerRetry: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    footerRetryLabel: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.primary,
    },
    emoji: {
      fontSize: 48,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 16,
      borderRadius: colors.radius,
      paddingVertical: 10,
      paddingHorizontal: 24,
      backgroundColor: colors.primary,
    },
    retryLabel: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
    },
  });
}
