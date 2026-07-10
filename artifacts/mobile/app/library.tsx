import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useOpenLibraryBooks, OpenLibraryBook } from '@/hooks/useOpenLibraryBooks';
import { LibraryBookCard } from '@/components/LibraryBookCard';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(colors, insets.top, insets.bottom);

  const { books, loading, loadingMore, error, loadMore, retry } = useOpenLibraryBooks();

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
        <View style={styles.backButton} />
      </View>

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
          data={books}
          keyExtractor={(item: OpenLibraryBook) => item.key}
          renderItem={({ item }) => <LibraryBookCard book={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
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
