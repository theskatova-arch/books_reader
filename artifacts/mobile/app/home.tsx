import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={[styles.squareButton, styles.secondaryButton]}
          activeOpacity={0.85}
          onPress={() => router.push('/library')}
        >
          <Text style={styles.squareEmoji}>📖</Text>
          <Text style={styles.secondaryButtonLabel}>Библиотека</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.squareButton, styles.primaryButton]}
          activeOpacity={0.85}
          onPress={() => router.push('/room')}
        >
          <Text style={styles.squareEmoji}>🛋️</Text>
          <Text style={styles.primaryButtonLabel}>Моя комната</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.promoCard}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://t.me/nopopular_books_club')}
      >
        <Ionicons name="paper-plane" size={20} color={colors.primary} style={styles.promoIcon} />
        <Text style={styles.promoText}>
          Подписывайся на мой{' '}
          <Text style={styles.promoLink}>Непопулярный книжный клуб</Text>
          , чтобы увидеть отзывы на книги
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.supportButton}
        activeOpacity={0.85}
        onPress={() => Linking.openURL('https://t.me/katyaskatova')}
      >
        <Text style={styles.supportButtonLabel}>Поддержка</Text>
      </TouchableOpacity>
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
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: topInset + 24,
      paddingBottom: bottomInset + 32,
      gap: 16,
    },
    mainRow: {
      flexDirection: 'row',
      gap: 16,
      width: '100%',
    },
    squareButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: colors.radius,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    squareEmoji: {
      fontSize: 36,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonLabel: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
      textAlign: 'center',
    },
    secondaryButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonLabel: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      textAlign: 'center',
    },
    supportButton: {
      backgroundColor: 'transparent',
      paddingVertical: 4,
    },
    supportButtonLabel: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    promoCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary + '44',
      borderRadius: colors.radius,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 10,
    },
    promoIcon: {
      marginTop: 1,
    },
    promoText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      lineHeight: 21,
    },
    promoLink: {
      fontFamily: 'Inter_600SemiBold',
      color: colors.primary,
    },
  });
}
