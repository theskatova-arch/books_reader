import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useOpenLibraryBooks, useOpenLibrarySearch, OpenLibraryBook } from '@/hooks/useOpenLibraryBooks';
import { useBooks } from '@/context/BooksContext';
import { LibraryBookCard } from '@/components/LibraryBookCard';
import { SearchBar } from '@/components/SearchBar';
import { LibraryRandomPickerModal } from '@/components/LibraryRandomPickerModal';
import { BackToHomeButton } from '@/components/BackToHomeButton';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(colors, insets.bottom);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQueryState, setSearchQuery] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const { books, loading, loadingMore, error, loadMore, retry } = useOpenLibraryBooks();
  const {
    books: searchResults,
    loading: searchLoading,
    loadingMore: searchLoadingMore,
    error: searchError,
    loadMore: searchLoadMore,
    retry: searchRetry,
  } = useOpenLibrarySearch(searchVisible ? searchQueryState : '');
  const { addBook } = useBooks();

  const isSearching = searchVisible && searchQueryState.trim().length > 0;
  const displayBooks = isSearching ? searchResults : books;
  const displayLoading = isSearching ? searchLoading : loading;
  const displayLoadingMore = isSearching ? searchLoadingMore : loadingMore;
  const displayError = isSearching ? searchError : error;
  const displayLoadMore = isSearching ? searchLoadMore : loadMore;
  const displayRetry = isSearching ? searchRetry : retry;

  const handleAddToWantToRead = async (book: OpenLibraryBook): Promise<boolean> => {
    try {
      const coverUrl = book.coverId
        ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
        : undefined;
      await addBook(book.title, book.author, 'want-to-read', coverUrl);
      setAddedKeys((prev) => {
        const next = new Set(prev);
        next.add(book.key);
        return next;
      });
      return true;
    } catch {
      return false;
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.root}>
      <BackToHomeButton topPad={topPad} />

      <View
        style={[
          styles.header,
          {
            paddingTop: 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Библиотека
          </Text>
        </View>
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
            disabled={!isSearching && books.length === 0}
          >
            <Ionicons name="shuffle" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {searchVisible && (
        <SearchBar
          value={searchQueryState}
          onChangeText={setSearchQuery}
          onClose={() => { setSearchVisible(false); setSearchQuery(''); }}
        />
      )}

      {displayLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : displayError && displayBooks.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>
            {isSearching ? 'Не удалось найти книги' : 'Не удалось загрузить книги'}
          </Text>
          <Text style={styles.subtitle}>{displayError}</Text>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.75} onPress={displayRetry}>
            <Text style={styles.retryLabel}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayBooks}
          keyExtractor={(item: OpenLibraryBook) => item.key}
          renderItem={({ item }) => (
            <LibraryBookCard
              book={item}
              added={addedKeys.has(item.key)}
              onAdd={() => handleAddToWantToRead(item)}
            />
          )}
          extraData={addedKeys}
          contentContainerStyle={[
            styles.listContent,
            displayBooks.length === 0 && styles.centered,
          ]}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={displayLoadMore}
          ListEmptyComponent={
            isSearching ? (
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
            displayLoadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : displayError ? (
              <TouchableOpacity style={styles.footerRetry} activeOpacity={0.75} onPress={displayRetry}>
                <Text style={styles.footerRetryLabel}>Не удалось загрузить ещё. Повторить</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <LibraryRandomPickerModal
        visible={pickerVisible}
        excludeKeys={addedKeys}
        onAddToWantToRead={handleAddToWantToRead}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  bottomInset: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: 'Inter_700Bold',
      lineHeight: 32,
    },
    headerSub: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
