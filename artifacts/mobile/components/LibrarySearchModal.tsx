import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { LIBRARY_GENRES, LibraryGenre } from '@/constants/libraryGenres';
import type { LibrarySearchParams } from '@/hooks/useOpenLibraryBooks';

export type { LibrarySearchParams };

interface LibrarySearchModalProps {
  visible: boolean;
  initial: LibrarySearchParams;
  onSearch: (params: LibrarySearchParams) => void;
  onReset: () => void;
  onClose: () => void;
}

const ANY_GENRE = LIBRARY_GENRES[0]!;

export function LibrarySearchModal({
  visible,
  initial,
  onSearch,
  onReset,
  onClose,
}: LibrarySearchModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(initial.title);
  const [author, setAuthor] = useState(initial.author);
  const [genre, setGenre] = useState<LibraryGenre>(initial.genre);
  const [genreOpen, setGenreOpen] = useState(false);

  // Sync local state when modal reopens with new initial values
  React.useEffect(() => {
    if (visible) {
      setTitle(initial.title);
      setAuthor(initial.author);
      setGenre(initial.genre);
      setGenreOpen(false);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    onSearch({ title: title.trim(), author: author.trim(), genre });
    onClose();
  };

  const handleReset = () => {
    setTitle('');
    setAuthor('');
    setGenre(ANY_GENRE);
    setGenreOpen(false);
    onReset();
    onClose();
  };

  const handleSelectGenre = (g: LibraryGenre) => {
    setGenre(g);
    setGenreOpen(false);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.background,
      borderColor: colors.input,
      color: colors.foreground,
      borderRadius: colors.radius,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Поиск в библиотеке
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              {/* Title */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Название
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="Любое название"
                  placeholderTextColor={colors.mutedForeground}
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                  autoCorrect={false}
                />
              </View>

              {/* Author */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Автор
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="Любой автор"
                  placeholderTextColor={colors.mutedForeground}
                  value={author}
                  onChangeText={setAuthor}
                  returnKeyType="done"
                  autoCorrect={false}
                />
              </View>

              {/* Genre dropdown */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Жанр
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: genreOpen ? colors.primary : colors.input,
                      borderRadius: colors.radius,
                    },
                  ]}
                  onPress={() => setGenreOpen((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownValue,
                      {
                        color:
                          genre.subject == null
                            ? colors.mutedForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {genre.label}
                  </Text>
                  <Ionicons
                    name={genreOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>

                {genreOpen && (
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    {LIBRARY_GENRES.map((g, i) => {
                      const active = g.subject === genre.subject;
                      const isLast = i === LIBRARY_GENRES.length - 1;
                      return (
                        <TouchableOpacity
                          key={g.label}
                          style={[
                            styles.dropdownItem,
                            !isLast && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: colors.border,
                            },
                            active && { backgroundColor: colors.secondary },
                          ]}
                          onPress={() => handleSelectGenre(g)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemLabel,
                              { color: active ? colors.primary : colors.foreground },
                            ]}
                          >
                            {g.label}
                          </Text>
                          {active && (
                            <Ionicons name="checkmark" size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.resetBtn,
                  { borderColor: colors.border, borderRadius: colors.radius },
                ]}
                onPress={handleReset}
                activeOpacity={0.75}
              >
                <Text style={[styles.resetLabel, { color: colors.mutedForeground }]}>
                  Сбросить
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.searchBtn,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                ]}
                onPress={handleSearch}
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={16} color={colors.primaryForeground} />
                <Text style={[styles.searchLabel, { color: colors.primaryForeground }]}>
                  Найти
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  formContent: {
    gap: 16,
    paddingBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  dropdownBtn: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  dropdownList: {
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownItemLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  resetBtn: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  resetLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  searchBtn: {
    flex: 2,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
