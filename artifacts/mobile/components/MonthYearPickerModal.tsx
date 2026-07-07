import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ITEM_H = 46;
const VISIBLE = 5; // rows visible at once
const COL_H = ITEM_H * VISIBLE;

interface Props {
  visible: boolean;
  /** 0-based month, or null if no filter is active */
  initialMonth: number | null;
  initialYear: number | null;
  availableYears: number[];
  onConfirm: (month: number, year: number) => void;
  onClear: () => void;
  onCancel: () => void;
}

function PickerColumn<T extends string | number>({
  items,
  selected,
  onSelect,
  keyOf,
  labelOf,
}: {
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  keyOf: (v: T) => string;
  labelOf: (v: T) => string;
}) {
  const colors = useColors();
  const ref = useRef<FlatList<T>>(null);

  const selectedIndex = items.indexOf(selected);

  // Scroll to the selected item on mount and when selection changes
  useEffect(() => {
    if (selectedIndex < 0) return;
    // delay one frame so FlatList has laid out
    const t = setTimeout(() => {
      ref.current?.scrollToIndex({ index: selectedIndex, animated: false, viewPosition: 0.5 });
    }, 50);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  return (
    <View style={[styles.column, { borderColor: colors.border }]}>
      {/* Selection highlight band */}
      <View
        style={[
          styles.selectionBand,
          { backgroundColor: colors.secondary, top: ITEM_H * 2 },
        ]}
        pointerEvents="none"
      />
      <FlatList
        ref={ref}
        data={items}
        keyExtractor={(item) => keyOf(item)}
        getItemLayout={(_, index) => ({
          length: ITEM_H,
          offset: ITEM_H * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.max(0, Math.min(items.length - 1, idx));
          onSelect(items[clamped]);
        }}
        // Padding so first/last items can center
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        style={{ height: COL_H }}
        renderItem={({ item }) => {
          const active = keyOf(item) === keyOf(selected);
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onSelect(item);
                const idx = items.indexOf(item);
                ref.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: active ? colors.primary : colors.foreground,
                    fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    opacity: active ? 1 : 0.65,
                  },
                ]}
              >
                {labelOf(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

export function MonthYearPickerModal({
  visible,
  initialMonth,
  initialYear,
  availableYears,
  onConfirm,
  onClear,
  onCancel,
}: Props) {
  const colors = useColors();

  const years = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  const defaultMonth = initialMonth ?? new Date().getMonth();
  const defaultYear = initialYear ?? years[0];

  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);

  // Reset to current filter values each time the modal opens
  useEffect(() => {
    if (visible) {
      setMonth(initialMonth ?? new Date().getMonth());
      setYear(initialYear ?? years[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const isFilterActive = initialMonth != null || initialYear != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Filter by Month &amp; Year
            </Text>
          </View>

          {/* Column headers */}
          <View style={styles.columnHeaders}>
            <Text style={[styles.columnHeader, { color: colors.mutedForeground }]}>Month</Text>
            <Text style={[styles.columnHeader, { color: colors.mutedForeground }]}>Year</Text>
          </View>

          {/* Pickers */}
          <View style={styles.pickers}>
            <PickerColumn<number>
              items={MONTHS.map((_, i) => i)}
              selected={month}
              onSelect={setMonth}
              keyOf={(v) => String(v)}
              labelOf={(v) => MONTHS[v]}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <PickerColumn<number>
              items={years}
              selected={year}
              onSelect={setYear}
              keyOf={(v) => String(v)}
              labelOf={(v) => String(v)}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {isFilterActive && (
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline, { borderColor: colors.border }]}
                onPress={onClear}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, { color: colors.mutedForeground }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline, { borderColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnLabel, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary }]}
              onPress={() => onConfirm(month, year)}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnLabel, { color: colors.primaryForeground }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
    gap: 16,
  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  columnHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  columnHeader: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  column: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_H,
    zIndex: 0,
    borderRadius: 0,
  },
  divider: {
    width: 12,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  itemLabel: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1,
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
