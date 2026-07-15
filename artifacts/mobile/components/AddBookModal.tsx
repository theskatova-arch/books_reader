import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
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
import { useOpenLibrarySuggestions, BookSuggestion } from '@/hooks/useOpenLibrarySuggestions';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  targetStatus: BookStatus;
  /** Called after a book is successfully added (before modal closes). */
  onSuccess?: () => void;
}

type Mode = 'manual' | 'pick';

export function AddBookModal({
  visible,
  onClose,
  targetStatus,
  onSuccess,
}: AddBookModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBook, moveBook, books } = useBooks();
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [mode, setMode] = useState<Mode>('manual');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [titleError, setTitleError] = useState(false);

  // After the user picks a suggestion we freeze suggestions until they edit again
  const [suggestionPicked, setSuggestionPicked] = useState(false);

  const wantToReadBooks = books.filter((b) => b.status === 'want-to-read');
  const showPickMode =
    (targetStatus === 'reading' || targetStatus === 'read') &&
    wantToReadBooks.length > 0;

  // Combined query drives the OL typeahead
  const rawQuery = [title, author].filter(Boolean).join(' ');
  const suggestionsQuery = mode === 'manual' && !suggestionPicked ? rawQuery : '';
  const { books: suggestions, loading: suggestionsLoading } =
    useOpenLibrarySuggestions(suggestionsQuery);

  const showSuggestions =
    mode === 'manual' &&
    !suggestionPicked &&
    rawQuery.trim().length >= 2 &&
    (suggestionsLoading || suggestions.length > 0);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setAuthor('');
      setTitleError(false);
      setSuggestionPicked(false);
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

  // Manual "Добавить" — ignores suggestions, uses typed values
  const handleAdd = () => {
    if (title.trim().length === 0) {
      setTitleError(true);
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addBook(title.trim(), author.trim(), targetStatus);
    onSuccess?.();
    handleClose();
  };

  // Tap a suggestion — adds it with OL cover and closes
  const handleSuggestionSelect = (book: BookSuggestion) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const coverUrl = book.coverUrl ?? undefined;
    addBook(book.title, book.author, targetStatus, coverUrl);
    onSuccess?.();
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
                  {/* Title */}
                  <View>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: titleError ? colors.destructive : colors.input,
                          color: colors.foreground,
                          borderRadius: colors.radius,
                        },
                      ]}
                      placeholder="Название книги *"
                      placeholderTextColor={colors.mutedForeground}
                      value={title}
                      onChangeText={(t) => {
                        setTitle(t);
                        setSuggestionPicked(false);
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

                  {/* Author */}
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
                    onChangeText={(a) => {
                      setAuthor(a);
                      setSuggestionPicked(false);
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleAdd}
                  />

                  {/* OL suggestions */}
                  {showSuggestions && (
                    <View
                      style={[
                        styles.suggestionsBox,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          borderRadius: colors.radius,
                        },
                      ]}
                    >
                      {suggestionsLoading && suggestions.length === 0 ? (
                        <View style={styles.suggestionsLoader}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.suggestionsLoaderText, { color: colors.mutedForeground }]}>
                            Ищем в библиотеке…
                          </Text>
                        </View>
                      ) : (
                        <ScrollView
                          style={styles.suggestionsList}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={false}
                        >
                          {suggestions.map((item, idx) => {
                            const isLast = idx === suggestions.length - 1;
                            return (
                              <TouchableOpacity
                                key={item.key}
                                style={[
                                  styles.suggestionItem,
                                  !isLast && {
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                    borderBottomColor: colors.border,
                                  },
                                ]}
                                onPress={() => handleSuggestionSelect(item)}
                                activeOpacity={0.7}
                              >
                                {item.coverUrl ? (
                                  <Image
                                    source={{ uri: item.coverUrl }}
                                    style={[
                                      styles.suggestionCover,
                                      { backgroundColor: colors.secondary },
                                    ]}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View
                                    style={[
                                      styles.suggestionCover,
                                      styles.suggestionCoverPlaceholder,
                                      { backgroundColor: colors.secondary },
                                    ]}
                                  >
                                    <Ionicons
                                      name="book-outline"
                                      size={14}
                                      color={colors.mutedForeground}
                                    />
                                  </View>
                                )}
                                <View style={styles.suggestionText}>
                                  <Text
                                    style={[styles.suggestionTitle, { color: colors.foreground }]}
                                    numberOfLines={1}
                                  >
                                    {item.title}
                                  </Text>
                                  {item.author ? (
                                    <Text
                                      style={[styles.suggestionAuthor, { color: colors.mutedForeground }]}
                                      numberOfLines={1}
                                    >
                                      {item.author}
                                    </Text>
                                  ) : null}
                                </View>
                                <Ionicons
                                  name="add-circle-outline"
                                  size={20}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  )}

                  {/* Add button */}
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: colors.primary, borderRadius: colors.radius },
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
    gap: 10,
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
  suggestionsBox: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionsLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  suggestionsLoaderText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  suggestionsList: {
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionCover: {
    width: 34,
    height: 50,
    borderRadius: 4,
  },
  suggestionCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  suggestionAuthor: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  addButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addButtonLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
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
