import React, { useRef, useState } from 'react';
import { TutorialSpotlight, SpotlightRect } from '@/components/TutorialSpotlight';
import { useTutorialStep } from '@/hooks/useTutorialStep';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useBooks } from '@/context/BooksContext';
import { useAuth } from '@/context/AuthContext';
import { BookCard } from '@/components/BookCard';
import { AddBookModal } from '@/components/AddBookModal';
import { RandomPickerModal } from '@/components/RandomPickerModal';
import { HeaderMenu, HeaderMenuHandle } from '@/components/HeaderMenu';
import { SearchBar } from '@/components/SearchBar';
import { BackToHomeButton } from '@/components/BackToHomeButton';

function pluralBooks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} книг`;
  if (mod10 === 1) return `${n} книга`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} книги`;
  return `${n} книг`;
}

export default function WantToReadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, moveBook } = useBooks();
  const { logout, username } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { seen: tutorialSeen, markSeen: markTutorialSeen } = useTutorialStep('room-burger');
  const [burgerRect, setBurgerRect] = useState<SpotlightRect | null>(null);
  const headerMenuRef = useRef<HeaderMenuHandle>(null);

  const list = books
    .filter((b) => b.status === 'want-to-read')
    .sort((a, b) => b.addedAt - a.addedAt);

  const displayList = searchQuery.trim()
    ? list.filter((b) => {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          (b.author?.toLowerCase().includes(q) ?? false)
        );
      })
    : list;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            Хочу прочитать
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {pluralBooks(list.length)}
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
          <HeaderMenu
            ref={headerMenuRef}
            topOffset={topPad + 114}
            onBurgerLayout={setBurgerRect}
            items={[
              {
                label: 'Добавить книгу',
                icon: 'add-circle-outline',
                onPress: () => {
                  if (tutorialSeen === false) markTutorialSeen();
                  setModalVisible(true);
                },
              },
              {
                label: 'Случайная книга',
                icon: 'shuffle',
                onPress: () => {
                  if (tutorialSeen === false) markTutorialSeen();
                  setPickerVisible(true);
                },
                hidden: list.length === 0,
              },
              {
                label: 'Выйти',
                icon: 'log-out-outline',
                onPress: () => logout(),
                destructive: true,
              },
            ]}
          />
        </View>
      </View>

      {searchVisible && (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClose={() => { setSearchVisible(false); setSearchQuery(''); }}
        />
      )}

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookCard book={item} />}
        contentContainerStyle={[
          styles.listContent,
          displayList.length === 0 && styles.centered,
          { paddingBottom: Platform.OS === 'web' ? 84 : insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={displayList.length > 0}
        ListEmptyComponent={
          searchQuery.trim() ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Ничего не найдено
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Попробуйте другой запрос
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Список пуст
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Нажмите +, чтобы добавить первую книгу
              </Text>
            </View>
          )
        }
      />

      <AddBookModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        targetStatus="want-to-read"
      />

      <RandomPickerModal
        visible={pickerVisible}
        books={list}
        onStartReading={(book) => {
          moveBook(book.id, 'reading');
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />

      <TutorialSpotlight
        visible={tutorialSeen === false && burgerRect !== null}
        targetRect={burgerRect}
        text="Ты можешь самостоятельно добавить книгу в свой список для чтения или выбрать из своего списка случайную и начать читать"
        onConfirm={() => headerMenuRef.current?.openMenu()}
        onSkip={markTutorialSeen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 12,
  },
  centered: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
