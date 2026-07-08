import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onClose,
  placeholder = 'Поиск по названию или автору',
}: SearchBarProps) {
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);

  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 52,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      inputRef.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    inputRef.current?.blur();
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(onClose);
  };

  return (
    <Animated.View style={{ height: heightAnim, opacity: opacityAnim, overflow: 'hidden' }}>
      <View
        style={[
          styles.row,
          { borderColor: colors.border, backgroundColor: colors.secondary },
        ]}
      >
        <Ionicons name="search-outline" size={17} color={colors.mutedForeground} />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <TouchableOpacity onPress={handleClose} hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="close" size={19} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 18,
  },
});
