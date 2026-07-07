import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Book, BookStatus, useBooks } from '@/context/BooksContext';

interface BookCardProps {
  book: Book;
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Inline page-position editor shown on Currently Reading cards. */
function ProgressEditor({ book }: { book: Book }) {
  const colors = useColors();
  const { updateProgress } = useBooks();

  const [currentInput, setCurrentInput] = useState(
    book.currentPage != null ? String(book.currentPage) : '',
  );
  const [totalInput, setTotalInput] = useState(
    book.totalPages != null ? String(book.totalPages) : '',
  );

  // Keep local state in sync if the book is updated externally
  useEffect(() => {
    setCurrentInput(book.currentPage != null ? String(book.currentPage) : '');
  }, [book.currentPage]);
  useEffect(() => {
    setTotalInput(book.totalPages != null ? String(book.totalPages) : '');
  }, [book.totalPages]);

  const save = () => {
    const current = parseInt(currentInput, 10);
    const total = parseInt(totalInput, 10);
    if (!Number.isFinite(current) || current < 0) return;
    updateProgress(
      book.id,
      current,
      Number.isFinite(total) && total > 0 ? total : undefined,
    );
  };

  const total = parseInt(totalInput, 10);
  const current = parseInt(currentInput, 10);
  const progress =
    Number.isFinite(total) && total > 0 && Number.isFinite(current) && current >= 0
      ? Math.min(current / total, 1)
      : null;

  return (
    <View style={styles.progressSection}>
      {/* Progress bar */}
      {progress !== null && (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>
      )}

      {/* Page inputs row */}
      <View style={styles.pageRow}>
        <Ionicons
          name="bookmark-outline"
          size={14}
          color={colors.mutedForeground}
          style={styles.pageIcon}
        />
        <Text style={[styles.pageLabel, { color: colors.mutedForeground }]}>
          Page
        </Text>
        <TextInput
          style={[
            styles.pageInput,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          keyboardType="number-pad"
          value={currentInput}
          onChangeText={setCurrentInput}
          onBlur={save}
          placeholder="—"
          placeholderTextColor={colors.mutedForeground}
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={save}
        />
        <Text style={[styles.pageLabel, { color: colors.mutedForeground }]}>
          of
        </Text>
        <TextInput
          style={[
            styles.pageInput,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          keyboardType="number-pad"
          value={totalInput}
          onChangeText={setTotalInput}
          onBlur={save}
          placeholder="—"
          placeholderTextColor={colors.mutedForeground}
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={save}
        />
        {progress !== null && (
          <Text style={[styles.percentLabel, { color: colors.primary }]}>
            {Math.round(progress * 100)}%
          </Text>
        )}
      </View>
    </View>
  );
}

export function BookCard({ book }: BookCardProps) {
  const colors = useColors();
  const { moveBook, deleteBook } = useBooks();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleMove = (newStatus: BookStatus) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    moveBook(book.id, newStatus);
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    deleteBook(book.id);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.textBlock}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {book.title}
            </Text>
            {book.author.length > 0 && (
              <Text
                style={[styles.author, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {book.author}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {/* Reading progress editor */}
        {book.status === 'reading' && <ProgressEditor book={book} />}

        {book.status !== 'read' && (
          <View style={styles.actionsRow}>
            {book.status === 'want-to-read' && (
              <>
                <ActionButton
                  icon="book-outline"
                  label="Start Reading"
                  color={colors.primary}
                  onPress={() => handleMove('reading')}
                />
                <ActionButton
                  icon="checkmark-circle-outline"
                  label="Already Read"
                  color={colors.accent}
                  onPress={() => handleMove('read')}
                />
              </>
            )}
            {book.status === 'reading' && (
              <ActionButton
                icon="checkmark-circle"
                label="Mark as Finished"
                color={colors.primary}
                onPress={() => handleMove('read')}
              />
            )}
          </View>
        )}

        {book.status === 'read' && (
          <View style={styles.finishedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.finishedLabel, { color: colors.primary }]}>
              Finished
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  author: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  deleteBtn: {
    marginTop: 2,
  },
  // ── Progress editor ──────────────────────────────────────
  progressSection: {
    marginTop: 12,
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageIcon: {
    marginRight: 2,
  },
  pageLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  pageInput: {
    width: 56,
    height: 30,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  percentLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
  // ── Actions ──────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  finishedLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
