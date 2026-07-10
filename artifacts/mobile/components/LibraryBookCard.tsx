import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { OpenLibraryBook } from '@/hooks/useOpenLibraryBooks';

interface LibraryBookCardProps {
  book: OpenLibraryBook;
}

export function LibraryBookCard({ book }: LibraryBookCardProps) {
  const colors = useColors();

  const coverUri = book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
    : null;

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
