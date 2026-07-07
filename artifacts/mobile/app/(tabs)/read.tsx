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

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface ActiveFilter {
  month: number; // 0-based
  year: number;
}

export default function ReadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useBooks();

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [filter, setFilter] = useState<ActiveFilter | null>(null);

  const allRead = books.filter((b) => b.status === 'read');

  // Years that have at least one finished book with a date, newest first
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const b of allRead) {
      if (b.finishedAt != null) set.add(new Date(b.finishedAt).getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [allRead]);

  // Apply filter
  const list = useMemo(() => {
    if (!filter) return allRead;
    return allRead.filter((b) => {
      if (b.finishedAt == null) return false;
      const d = new Date(b.finishedAt);
      return d.getMonth() === filter.month && d.getFullYear() === filter.year;
    });
  }, [allRead, filter]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filterLabel = filter
    ? `${MONTHS_SHORT[filter.month]} ${filter.year}`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Finished
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {list.length} {list.length === 1 ? 'book' : 'books'}
            {filter ? ` in ${filterLabel}` : ' read'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Filter button */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter ? colors.primary : colors.card,
                borderColor: filter ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={filter ? 'funnel' : 'funnel-outline'}
              size={14}
              color={filter ? colors.primaryForeground : colors.foreground}
            />
            {filterLabel && (
              <Text style={[styles.filterBtnLabel, { color: colors.primaryForeground }]}>
                {filterLabel}
              </Text>
            )}
          </TouchableOpacity>

          {/* Add button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
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
            <Ionicons
              name={filter ? 'funnel-outline' : 'checkmark-circle-outline'}
              size={52}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter
                ? `No books in ${filterLabel}`
                : 'No books finished yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {filter
                ? 'Try a different month or year'
                : 'Books you finish will appear here'}
            </Text>
            {filter && (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: colors.border }]}
                onPress={() => setFilter(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearBtnLabel, { color: colors.foreground }]}>
                  Clear filter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <AddBookModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        targetStatus="read"
      />

      <MonthYearPickerModal
        visible={pickerVisible}
        initialMonth={filter?.month ?? null}
        initialYear={filter?.year ?? null}
        availableYears={availableYears}
        onConfirm={(month, year) => {
          setFilter({ month, year });
          setPickerVisible(false);
        }}
        onClear={() => {
          setFilter(null);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />
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
  headerLeft: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterBtnLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingTop: 12 },
  centered: { flex: 1 },
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
  clearBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 20,
  },
  clearBtnLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
