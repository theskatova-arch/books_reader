import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
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
import { EditDateModal } from '@/components/EditDateModal';
import { CommentModal } from '@/components/CommentModal';

interface BookCardProps {
  book: Book;
  /** If provided, called with the screen-relative rect of the "Начать читать" button. */
  onStartReadingLayout?: (rect: { x: number; y: number; width: number; height: number }) => void;
  /** If provided, called with the screen-relative rect of the "Завершить чтение" button. */
  onFinishReadingLayout?: (rect: { x: number; y: number; width: number; height: number }) => void;
}

type EditingField = 'startedReadingAt' | 'finishedAt';

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

function DateChip({
  label,
  timestamp,
  color,
  onPress,
}: {
  label: string;
  timestamp: number;
  color: string;
  onPress: () => void;
}) {
  const formatted = new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <TouchableOpacity
      style={styles.dateChip}
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.dateChipText, { color }]}>
        {label} {formatted}
      </Text>
      <Ionicons name="pencil-outline" size={11} color={color} style={styles.dateChipIcon} />
    </TouchableOpacity>
  );
}

export function BookCard({ book, onStartReadingLayout, onFinishReadingLayout }: BookCardProps) {
  const colors = useColors();
  const { moveBook, deleteBook, updateDates, updateComment } = useBooks();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const startReadingBtnRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const finishReadingBtnRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [commentVisible, setCommentVisible] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
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

  const handleDateSave = (d: Date) => {
    if (!editingField) return;
    updateDates(book.id, { [editingField]: d.getTime() });
    setEditingField(null);
  };

  const handleCommentSave = (text: string) => {
    updateComment(book.id, text || null);
    setCommentVisible(false);
  };

  const handleCommentClear = () => {
    updateComment(book.id, null);
    setCommentVisible(false);
  };

  const editingDate =
    editingField === 'startedReadingAt'
      ? new Date(book.startedReadingAt ?? Date.now())
      : new Date(book.finishedAt ?? Date.now());

  const editingTitle =
    editingField === 'startedReadingAt'
      ? 'Дата начала'
      : 'Дата окончания';

  return (
    <>
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
            {book.coverUrl && (
              <View style={[styles.coverWrap, { backgroundColor: colors.secondary }]}>
                <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
              </View>
            )}

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

          {/* Dates */}
          {(book.startedReadingAt != null || book.finishedAt != null) && (
            <View style={styles.datesRow}>
              {book.startedReadingAt != null && (
                <DateChip
                  label="Начато"
                  timestamp={book.startedReadingAt}
                  color={colors.mutedForeground}
                  onPress={() => setEditingField('startedReadingAt')}
                />
              )}
              {book.finishedAt != null && book.status === 'read' && (
                <DateChip
                  label="Закончено"
                  timestamp={book.finishedAt}
                  color={colors.primary}
                  onPress={() => setEditingField('finishedAt')}
                />
              )}
            </View>
          )}

          {book.status !== 'read' && (
            <View style={styles.actionsRow}>
              {book.status === 'want-to-read' && (
                <>
                  {/* Inlined so we can attach a ref for tutorial measurement */}
                  <TouchableOpacity
                    ref={startReadingBtnRef}
                    style={[styles.actionBtn, { borderColor: colors.primary }]}
                    onPress={() => handleMove('reading')}
                    onLayout={() => {
                      startReadingBtnRef.current?.measure(
                        (_x: number, _y: number, w: number, h: number, px: number, py: number) => {
                          onStartReadingLayout?.({ x: px, y: py, width: w, height: h });
                        },
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="book-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionBtnLabel, { color: colors.primary }]}>
                      Начать читать
                    </Text>
                  </TouchableOpacity>
                  <ActionButton
                    icon="checkmark-circle-outline"
                    label="Уже прочитал"
                    color={colors.accent}
                    onPress={() => handleMove('read')}
                  />
                </>
              )}
              {book.status === 'reading' && (
                <TouchableOpacity
                  ref={finishReadingBtnRef}
                  style={[styles.actionBtn, { borderColor: colors.primary }]}
                  onPress={() => handleMove('read')}
                  onLayout={() => {
                    finishReadingBtnRef.current?.measure(
                      (_x: number, _y: number, w: number, h: number, px: number, py: number) => {
                        onFinishReadingLayout?.({ x: px, y: py, width: w, height: h });
                      },
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.actionBtnLabel, { color: colors.primary }]}>
                    Завершить чтение
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {book.status === 'read' && book.finishedAt == null && (
            <View style={styles.finishedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.finishedLabel, { color: colors.primary }]}>
                Прочитано
              </Text>
            </View>
          )}

          {/* Comment section — only for finished books */}
          {book.status === 'read' && (
            book.comment ? (
              <TouchableOpacity
                style={[styles.commentBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => setCommentVisible(true)}
                activeOpacity={0.75}
              >
                <View style={styles.commentHeader}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.primary} />
                  <Text style={[styles.commentLabel, { color: colors.primary }]}>
                    Отзыв
                  </Text>
                  <Ionicons name="pencil-outline" size={11} color={colors.mutedForeground} style={styles.commentEditIcon} />
                </View>
                <Text style={[styles.commentText, { color: colors.foreground }]} numberOfLines={3}>
                  {book.comment}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addCommentBtn}
                onPress={() => setCommentVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <Ionicons name="add-circle-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.addCommentLabel, { color: colors.mutedForeground }]}>
                  Добавить отзыв
                </Text>
              </TouchableOpacity>
            )
          )}
        </Animated.View>
      </Pressable>

      {editingField != null && (
        <EditDateModal
          visible
          title={editingTitle}
          date={editingDate}
          onConfirm={handleDateSave}
          onCancel={() => setEditingField(null)}
        />
      )}

      <CommentModal
        visible={commentVisible}
        initialComment={book.comment}
        bookTitle={book.title}
        onConfirm={handleCommentSave}
        onClear={handleCommentClear}
        onCancel={() => setCommentVisible(false)}
      />
    </>
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
  coverWrap: {
    width: 44,
    height: 64,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
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
  datesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateChipText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  dateChipIcon: {
    marginTop: 1,
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
  commentBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commentLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  commentEditIcon: {
    marginTop: 1,
  },
  commentText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  addCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  addCommentLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
