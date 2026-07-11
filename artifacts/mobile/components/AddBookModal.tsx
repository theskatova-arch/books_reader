import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Book, BookStatus, useBooks } from '@/context/BooksContext';
import { GENRES } from '@/constants/genres';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  targetStatus: BookStatus;
}

type Mode = 'manual' | 'pick';

export function AddBookModal({
  visible,
  onClose,
  targetStatus,
}: AddBookModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBook, moveBook, books } = useBooks();
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [mode, setMode] = useState<Mode>('manual');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [titleError, setTitleError] = useState(false);

  const wantToReadBooks = books.filter((b) => b.status === 'want-to-read');
  const showPickMode =
    (targetStatus === 'reading' || targetStatus === 'read') &&
    wantToReadBooks.length > 0;

  useEffect(() => {
    if (visible) {
      setTitle('');
      setAuthor('');
      setGenre(null);
      setTitleError(false);
      setMode('manual');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleAdd = () => {
    if (title.trim().length === 0) {
      setTitleError(true);
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addBook(title.trim(), author.trim(), targetStatus, undefined, genre ?? undefined);
    handleClose();
  };

  const handlePickBook = (book: Book) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    moveBook(book.id, targetStatus);
    handleClose();
  };

  const statusLabel =
    targetStatus === 'reading'
      ? 'Читаю сейчас'
      : targetStatus === 'read'
        ? 'Прочитано'
        : 'Хочу прочитать';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvContainer}
        >
          <Pressable>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  paddingBottom: insets.bottom + 16,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Добавить в «{statusLabel}»
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={12}>
                  <Ionicons name="close" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Mode toggle */}
              {showPickMode && (
                <View style={[styles.modeToggle, { backgroundColor: colors.muted }]}>
                  {(['manual', 'pick'] as Mode[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.modeBtn,
                        mode === m && {
                          backgroundColor: colors.card,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        },
                      ]}
                      onPress={() => setMode(m)}
                    >
                      <Text
                        style={[
                          styles.modeBtnLabel,
                          {
                            color:
                              mode === m
                                ? colors.foreground
                                : colors.mutedForeground,
                          },
                        ]}
                      >
                        {m === 'manual' ? 'Новая книга' : 'Из списка'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Manual form */}
              {mode === 'manual' && (
                <View style={styles.form}>
                  <View>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: titleError
                            ? colors.destructive
                            : colors.input,
                          color: colors.foreground,
                          borderRadius: colors.radius,
                        },
                      ]}
                      placeholder="Название книги *"
                      placeholderTextColor={colors.mutedForeground}
                      value={title}
                      onChangeText={(t) => {
                        setTitle(t);
                        if (t.trim().length > 0) setTitleError(false);
                      }}
                      returnKeyType="next"
                      autoFocus
                    />
                    {titleError && (
                      <Text style={[styles.errorText, { color: colors.destructive }]}>
                        Укажите название
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.input,
                        color: colors.foreground,
                        borderRadius: colors.radius,
                      },
                    ]}
                    placeholder="Автор (необязательно)"
                    placeholderTextColor={colors.mutedForeground}
                    value={author}
                    onChangeText={setAuthor}
                    returnKeyType="done"
                    onSubmitEditing={handleAdd}
                  />
                  {/* Genre chips */}
                  <View>
                    <Text style={[styles.genreLabel, { color: colors.mutedForeground }]}>
                      Жанр (необязательно)
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.genreRow}
                    >
                      {GENRES.map((g) => {
                        const active = genre === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            style={[
                              styles.genreChip,
                              {
                                borderColor: active ? colors.primary : colors.border,
                                backgroundColor: active ? colors.primary : colors.background,
                                borderRadius: colors.radius,
                              },
                            ]}
                            onPress={() => setGenre(active ? null : g)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.genreChipLabel,
                                { color: active ? colors.primaryForeground : colors.foreground },
                              ]}
                            >
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: colors.radius,
                      },
                    ]}
                    onPress={handleAdd}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.addButtonLabel, { color: colors.primaryForeground }]}>
                      Добавить
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Pick from list */}
              {mode === 'pick' && (
                <FlatList
                  data={wantToReadBooks}
                  keyExtractor={(item) => item.id}
                  style={styles.pickList}
                  scrollEnabled={wantToReadBooks.length > 4}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickItem,
                        {
                          borderColor: colors.border,
                          borderRadius: colors.radius,
                          backgroundColor: colors.background,
                        },
                      ]}
                      onPress={() => handlePickBook(item)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.pickItemText}>
                        <Text
                          style={[styles.pickItemTitle, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {item.author.length > 0 && (
                          <Text
                            style={[styles.pickItemAuthor, { color: colors.mutedForeground }]}
                            numberOfLines={1}
                          >
                            {item.author}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  kvContainer: {
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
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeBtnLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  form: {
    gap: 12,
    paddingBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginLeft: 2,
  },
  addButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addButtonLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  genreLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  genreRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  genreChipLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  pickList: {
    maxHeight: 300,
  },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickItemText: {
    flex: 1,
    gap: 2,
  },
  pickItemTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  pickItemAuthor: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
