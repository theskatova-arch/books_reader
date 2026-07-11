import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(colors, insets.top, insets.bottom);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.bookEmoji}>📚</Text>
        <Text style={styles.appName}>Книжная полка</Text>
        <Text style={styles.tagline}>Куда пойдём?</Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.promoText}>
          Подписывайся на мой{' '}
          <Text
            style={styles.promoLink}
            onPress={() => Linking.openURL('https://t.me/nopopular_books_club')}
          >
            Непопулярный книжный клуб
          </Text>
          , чтобы увидеть отзывы на книги
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          activeOpacity={0.85}
          onPress={() => router.push('/room')}
        >
          <Text style={styles.primaryButtonLabel}>Моя комната</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          activeOpacity={0.85}
          onPress={() => router.push('/library')}
        >
          <Text style={styles.secondaryButtonLabel}>Библиотека</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.supportButton]}
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://t.me/katyaskatova')}
        >
          <Text style={styles.supportButtonLabel}>Поддержка</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  topInset: number,
  bottomInset: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: topInset + 24,
      paddingBottom: bottomInset + 32,
    },
    bottom: {
      position: 'absolute',
      bottom: bottomInset + 24,
      left: 24,
      right: 24,
      alignItems: 'center',
    },
    promoText: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    promoLink: {
      fontFamily: 'Inter_500Medium',
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    hero: {
      alignItems: 'center',
      marginBottom: 48,
    },
    bookEmoji: {
      fontSize: 56,
      marginBottom: 12,
    },
    appName: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 6,
    },
    buttons: {
      gap: 14,
    },
    button: {
      borderRadius: colors.radius,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonLabel: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
    },
    secondaryButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonLabel: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    supportButton: {
      backgroundColor: 'transparent',
    },
    supportButtonLabel: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
  });
}
