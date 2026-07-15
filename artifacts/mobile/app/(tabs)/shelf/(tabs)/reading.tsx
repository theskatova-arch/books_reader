import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useBooks } from '@/context/BooksContext';
import { BookCard } from '@/components/BookCard';
import { AddBookModal } from '@/components/AddBookModal';
import { HeaderMenu } from '@/components/HeaderMenu';

function pluralBooks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} книг`;
  if (mod10 === 1) return `${n} книга`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} книги`;
  return `${n} книг`;
}

export default function ReadingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useBooks();
  const [modalVisible, setModalVisible] = useState(false);

  const list = books
    .filter((b) => b.status === 'reading')
    .sort((a, b) => (b.startedReadingAt ?? b.addedAt) - (a.startedReadingAt ?? a.addedAt));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <HeaderMenu
          topOffset={114}
          items={[{ label: 'Добавить книгу', icon: 'add-circle-outline', onPress: () => setModalVisible(true) }]}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookCard book={item} />}
        contentContainerStyle={[
          styles.listContent,
          list.length === 0 && styles.centered,
          { paddingBottom: Platform.OS === 'web' ? 84 : insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={list.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ничего не читается</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Начните книгу из списка или добавьте новую</Text>
          </View>
        }
      />

      <AddBookModal visible={modalVisible} onClose={() => setModalVisible(false)} targetStatus="reading" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  listContent: { paddingTop: 12 },
  centered: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 32 },
});
