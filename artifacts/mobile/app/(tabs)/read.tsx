import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
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

interface MonthYear {
  month: number; // 0-based
  year: number;
  label: string;
}

function buildKey(month: number, year: number) {
  return `${year}-${month}`;
}

export default function ReadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useBooks();
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<MonthYear | null>(null);

  const allRead = books.filter((b) => b.status === 'read');

  // Derive sorted unique month+year chips from finishedAt
  const chips = useMemo<MonthYear[]>(() => {
    const seen = new Map<string, MonthYear>();
    for (const b of allRead) {
      if (b.finishedAt == null) continue;
      const d = new Date(b.finishedAt);
      const m = d.getMonth();
      const y = d.getFullYear();
      const key = buildKey(m, y);
      if (!seen.has(key)) {
        seen.set(key, {
          month: m,
          year: y,
          label: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        });
      }
    }
    // Sort newest first
    return Array.from(seen.values()).sort(
      (a, b) => b.year - a.year || b.month - a.month,
    );
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

  const handleChipPress = (chip: MonthYear) => {
    const key = buildKey(chip.month, chip.year);
    const activeKey = filter ? buildKey(filter.month, filter.year) : null;
    setFilter(key === activeKey ? null : chip);
  };

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
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Finished
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {list.length} {list.length === 1 ? 'book' : 'books'}
            {filter ? ` in ${filter.label}` : ' read'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Month/year filter chips */}
      {chips.length > 0 && (
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {chips.map((chip) => {
              const active =
                filter != null &&
                buildKey(chip.month, chip.year) ===
                  buildKey(filter.month, filter.year);
              return (
                <TouchableOpacity
                  key={buildKey(chip.month, chip.year)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleChipPress(chip)}
                  activeOpacity={0.75}
                >
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.primaryForeground}
                      style={styles.chipCheck}
                    />
                  )}
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

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
              name="checkmark-circle-outline"
              size={52}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter ? `No books in ${filter.label}` : 'No books finished yet'}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              {filter
                ? 'Try a different month or clear the filter'
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Filter bar ───────────────────────────────────────────
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 4,
  },
  chipCheck: {
    marginRight: 2,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  // ── List ────────────────────────────────────────────────
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
