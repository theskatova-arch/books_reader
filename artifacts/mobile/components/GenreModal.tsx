import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GENRES } from '@/constants/genres';

interface GenreModalProps {
  visible: boolean;
  currentGenre?: string;
  onConfirm: (genre: string | null) => void;
  onCancel: () => void;
}

export function GenreModal({
  visible,
  currentGenre,
  onConfirm,
  onCancel,
}: GenreModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(currentGenre ?? null);

  // Reset local state when modal opens with new value
  React.useEffect(() => {
    if (visible) {
      setSelected(currentGenre ?? null);
    }
  }, [visible, currentGenre]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>Выберите жанр</Text>
              <TouchableOpacity onPress={onCancel} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Genre chips */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.chipsContainer}
              showsVerticalScrollIndicator={false}
            >
              {GENRES.map((g) => {
                const active = selected === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.background,
                        borderRadius: colors.radius,
                      },
                    ]}
                    onPress={() => setSelected(active ? null : g)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: active ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              {currentGenre != null && (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
                  onPress={() => onConfirm(null)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.clearLabel, { color: colors.mutedForeground }]}>Убрать жанр</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                ]}
                onPress={() => onConfirm(selected)}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmLabel, { color: colors.primaryForeground }]}>
                  Сохранить
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  scroll: {
    maxHeight: 280,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  clearLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
