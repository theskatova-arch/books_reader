import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { OpenLibraryBook } from '@/hooks/useOpenLibraryBooks';

interface LibraryBookCardProps {
  book: OpenLibraryBook;
  /** Whether this book is already in the user's "Хочу прочитать" list. */
  added: boolean;
  /** Resolves to true on success. The card shows an error state on failure
   *  instead of optimistically marking itself as added. */
  onAdd: () => Promise<boolean>;
}

export function LibraryBookCard({ book, added, onAdd }: LibraryBookCardProps) {
  const colors = useColors();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const coverUri = book.coverUrl ?? null;

  const handleAdd = async () => {
    if (added || saving) return;
    setSaving(true);
    setFailed(false);
    const ok = await onAdd();
    setSaving(false);
    if (!ok) setFailed(true);
  };

  return (
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
      <View style={[styles.coverWrap, { backgroundColor: colors.secondary }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
        ) : (
          <Text style={styles.coverPlaceholder}>📖</Text>
        )}
      </View>

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
        {book.firstPublishYear != null && (
          <Text style={[styles.year, { color: colors.mutedForeground }]}>
            {book.firstPublishYear}
          </Text>
        )}
      </View>

      <View style={styles.addWrap}>
        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              borderColor: added
                ? colors.border
                : failed
                ? colors.destructive
                : colors.primary,
              backgroundColor: added ? colors.secondary : colors.primary,
            },
          ]}
          onPress={handleAdd}
          activeOpacity={0.75}
          disabled={added || saving}
          hitSlop={8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Ionicons
              name={added ? 'checkmark' : failed ? 'refresh' : 'add'}
              size={18}
              color={added ? colors.mutedForeground : colors.primaryForeground}
            />
          )}
        </TouchableOpacity>
        {failed && (
          <Text style={[styles.errorLabel, { color: colors.destructive }]} numberOfLines={1}>
            Ошибка
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coverWrap: {
    width: 56,
    height: 80,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    fontSize: 24,
  },
  addWrap: {
    alignItems: 'center',
    gap: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  author: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  year: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
