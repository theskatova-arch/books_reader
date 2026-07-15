import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StarRatingProps {
  value: number | null | undefined;
  onChange: (rating: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 22 }: StarRatingProps) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star === value ? 0 : star)}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          activeOpacity={0.6}
        >
          <Ionicons
            name={value != null && value >= star ? 'star' : 'star-outline'}
            size={size}
            color={value != null && value >= star ? '#F59E0B' : colors.mutedForeground}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
