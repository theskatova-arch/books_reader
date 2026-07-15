import React, { useMemo, useState } from 'react';
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
import { BookCard } from '@/components/BookCard';
import { AddBookModal } from '@/components/AddBookModal';
import { MonthYearPickerModal } from '@/components/MonthYearPickerModal';
import { SearchBar } from '@/components/SearchBar';

const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

function pluralBooks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} книг`;
  if (mod10 === 1) return `${n} книга`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} книги`;
  return `${n} книг`;
}

interface ActiveFilter { month: number; year: number; }

export default function ReadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useBooks();

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [filter, setFilter] = useState<ActiveFilter | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allRead = books
    .filter((b) => b.status === 'read')
    .sort((a, b) => (b.finishedAt ?? b.addedAt) - (a.finishedAt ?? a.addedAt));

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const b of allRead) {
      if (b.finishedAt != null) set.add(new Date(b.finishedAt).getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [allRead]);

  const list = useMemo(() => {
    if (!filter) return allRead;
    return allRead.filter((b) => {
      if (b.finishedAt == null) return false;
      const d = new Date(b.finishedAt);
      return d.getMonth() === filter.month && d.getFullYear() === filter.year;
    });
  }, [allRead, filter]);

  const displayList = useMemo(() => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (b) => b.title.toLowerCase().includes(q) || (b.author?.toLowerCase().includes(q) ?? false)
    );
  }, [list, searchQuery]);

  const filterLabel = filter ? `${MONTHS_SHORT[filter.month]} ${filter.year}` : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.headerRight}>
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
          >
            <Ionicons name={filter ? 'funnel' : 'funnel-outline'} size={20} color={filter ? colors.primary : colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.border }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.75}
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color={colors.foreground} />
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
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ничего не найдено</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Попробуйте другой запрос</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name={filter ? 'funnel-outline' : 'checkmark-circle-outline'} size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {filter ? `Нет книг за ${filterLabel}` : 'Нет прочитанных книг'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {filter ? 'Попробуйте другой месяц или год' : 'Здесь появятся прочитанные книги'}
              </Text>
              {filter && (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: colors.border }]}
                  onPress={() => setFilter(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.clearBtnLabel, { color: colors.foreground }]}>Сбросить фильтр</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      <AddBookModal visible={modalVisible} onClose={() => setModalVisible(false)} targetStatus="read" />

      <MonthYearPickerModal
        visible={pickerVisible}
        initialMonth={filter?.month ?? null}
        initialYear={filter?.year ?? null}
        availableYears={availableYears}
        onConfirm={(month, year) => { setFilter({ month, year }); setPickerVisible(false); }}
        onClear={() => { setFilter(null); setPickerVisible(false); }}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingTop: 12 },
  centered: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 32 },
  clearBtn: { marginTop: 8, borderWidth: 1, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 20 },
  clearBtnLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
