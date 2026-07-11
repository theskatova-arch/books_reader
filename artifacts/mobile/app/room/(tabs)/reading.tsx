import React, { useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useBooks } from '@/context/BooksContext';
import { useAuth } from '@/context/AuthContext';
import { BookCard } from '@/components/BookCard';
import { AddBookModal } from '@/components/AddBookModal';
import { HeaderMenu, HeaderMenuHandle } from '@/components/HeaderMenu';
import { BackToHomeButton } from '@/components/BackToHomeButton';
import { TutorialSpotlight, SpotlightRect } from '@/components/TutorialSpotlight';
import { useTutorialStep } from '@/hooks/useTutorialStep';

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
  const { books, moveBook } = useBooks();
  const { logout } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const { seen: startReadSeen } = useTutorialStep('room-start-reading');
  const { seen: finishReadSeen, markSeen: markFinishReadSeen } = useTutorialStep('room-finish-reading');
  const [finishReadRect, setFinishReadRect] = useState<SpotlightRect | null>(null);

  const list = books
    .filter((b) => b.status === 'reading')
    .sort((a, b) => (b.startedReadingAt ?? b.addedAt) - (a.startedReadingAt ?? a.addedAt));

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
            Читаю сейчас
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {pluralBooks(list.length)}
          </Text>
        </View>
        <HeaderMenu
          topOffset={topPad + 114}
          items={[
            {
              label: 'Добавить книгу',
              icon: 'add-circle-outline',
              onPress: () => setModalVisible(true),
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

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <BookCard
            book={item}
            onFinishReadingLayout={
              index === 0 && startReadSeen === true && finishReadSeen === false
                ? setFinishReadRect
                : undefined
            }
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          list.length === 0 && styles.centered,
          { paddingBottom: Platform.OS === 'web' ? 84 : insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={list.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="book-outline"
              size={52}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Ничего не читается
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              Начните книгу из списка или добавьте новую
            </Text>
          </View>
        }
      />

      <AddBookModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        targetStatus="reading"
      />

      <TutorialSpotlight
        visible={startReadSeen === true && finishReadSeen === false && finishReadRect !== null}
        targetRect={finishReadRect}
        text={"Когда закончишь читать книгу, переведи ее в список «Прочитано»"}
        onConfirm={() => {
          markFinishReadSeen();
          if (list[0]) moveBook(list[0].id, 'read');
          router.navigate('/room/read');
        }}
        onSkip={markFinishReadSeen}
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
