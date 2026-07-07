import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
            {book.status === 'reading' && book.startedReadingAt != null && (
              <Text style={[styles.startedDate, { color: colors.mutedForeground }]}>
                Started{' '}
                {new Date(book.startedReadingAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
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
            {book.finishedAt != null && (
              <Text style={[styles.finishedDate, { color: colors.mutedForeground }]}>
                ·{' '}
                {new Date(book.finishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            )}
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
  startedDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  deleteBtn: {
    marginTop: 2,
  },
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
  finishedDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
