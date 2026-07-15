import React, { useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Book, useBooks } from '@/context/BooksContext';
import { EditDateModal } from '@/components/EditDateModal';
import { StarRating } from '@/components/StarRating';
import { AuthContext } from '@/context/AuthContext';

export function ReadingBookCard({ book }: { book: Book }) {
  const colors = useColors();
  const { moveBook, deleteBook, updateDates, updateRating } = useBooks();
  const auth = React.useContext(AuthContext);
  const isAuthed = auth?.user != null;
  const [editingDate, setEditingDate] = useState(false);

  const handleFinish = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    moveBook(book.id, 'read');
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteBook(book.id);
  };

  const handleDateSave = (d: Date) => {
    updateDates(book.id, { startedReadingAt: d.getTime() });
    setEditingDate(false);
  };

  const startedDate = book.startedReadingAt
    ? new Date(book.startedReadingAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {/* Cover */}
        <View style={[styles.coverWrap, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book-outline" size={56} color={colors.mutedForeground} />
            </View>
          )}

          {/* Delete button — top-right overlay */}
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
            onPress={handleDelete}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info below cover */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {book.title}
          </Text>

          {book.author.length > 0 && (
            <Text style={[styles.author, { color: colors.mutedForeground }]} numberOfLines={1}>
              {book.author}
            </Text>
          )}

          {startedDate && (
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setEditingDate(true)}
              activeOpacity={0.6}
              hitSlop={{ top: 6, bottom: 6, left: 0, right: 0 }}
            >
              <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                Начато {startedDate}
              </Text>
              <Ionicons name="pencil-outline" size={11} color={colors.mutedForeground} style={{ marginTop: 1 }} />
            </TouchableOpacity>
          )}

          {isAuthed && (
            <StarRating
              value={book.rating}
              onChange={(r) => updateRating(book.id, r === 0 ? null : r)}
              size={20}
            />
          )}

          <TouchableOpacity
            style={[styles.finishBtn, { borderColor: colors.primary }]}
            onPress={handleFinish}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.finishLabel, { color: colors.primary }]}>Завершить чтение</Text>
          </TouchableOpacity>
        </View>
      </View>

      {editingDate && (
        <EditDateModal
          visible
          title="Дата начала"
          date={new Date(book.startedReadingAt ?? Date.now())}
          onConfirm={handleDateSave}
          onCancel={() => setEditingDate(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  coverWrap: {
    width: '100%',
    height: 260,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 23,
  },
  author: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  finishLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
