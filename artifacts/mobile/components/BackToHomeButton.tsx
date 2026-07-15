import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

/**
 * Shared "back" affordance shown above the header on every tab screen
 * inside "Моя комната". Always returns to the post-login chooser
 * screen (Моя комната / Библиотека), regardless of navigation history.
 */
export function BackToHomeButton({ topPad }: { topPad: number }) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View
      style={[
        styles.row,
        { paddingTop: topPad, backgroundColor: colors.background },
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        hitSlop={8}
        onPress={() => router.replace('/library')}
      >
        <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        <Text style={[styles.label, { color: colors.foreground }]}>
          Назад
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 6,
    paddingRight: 10,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
