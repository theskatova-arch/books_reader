import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface CommentModalProps {
  visible: boolean;
  initialComment?: string;
  bookTitle: string;
  onConfirm: (comment: string) => void;
  onClear: () => void;
  onCancel: () => void;
}

const MAX_CHARS = 500;

export function CommentModal({
  visible,
  initialComment,
  bookTitle,
  onConfirm,
  onClear,
  onCancel,
}: CommentModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const [text, setText] = useState(initialComment ?? '');

  useEffect(() => {
    if (visible) {
      setText(initialComment ?? '');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialComment, slideAnim]);

  const handleSave = () => {
    Keyboard.dismiss();
    onConfirm(text.trim());
  };

  const handleClear = () => {
    Keyboard.dismiss();
    onClear();
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  const remaining = MAX_CHARS - text.length;
  const overLimit = remaining < 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvContainer}
        >
          <Pressable>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  paddingBottom: insets.bottom + 20,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    Отзыв о книге
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCancel} hitSlop={12}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              {/* Book title */}
              <Text
                style={[styles.bookName, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {bookTitle}
              </Text>

              {/* Input */}
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: overLimit ? colors.destructive : colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderRadius: colors.radius,
                  },
                ]}
                placeholder="Поделитесь впечатлениями о книге…"
                placeholderTextColor={colors.mutedForeground}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={MAX_CHARS + 10}
                textAlignVertical="top"
                autoFocus
              />

              {/* Character counter */}
              <Text
                style={[
                  styles.counter,
                  {
                    color: overLimit ? colors.destructive : colors.mutedForeground,
                  },
                ]}
              >
                {remaining < 100 ? `${remaining} символов осталось` : ''}
              </Text>

              {/* Actions */}
              <View style={styles.actions}>
                {(initialComment?.length ?? 0) > 0 && (
                  <TouchableOpacity
                    style={[styles.clearBtn, { borderColor: colors.destructive }]}
                    onPress={handleClear}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={colors.destructive}
                    />
                    <Text style={[styles.clearLabel, { color: colors.destructive }]}>
                      Удалить
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={handleCancel}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cancelLabel, { color: colors.foreground }]}>
                    Отмена
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor:
                        overLimit || text.trim().length === 0
                          ? colors.muted
                          : colors.primary,
                    },
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                  disabled={overLimit || text.trim().length === 0}
                >
                  <Text
                    style={[
                      styles.saveLabel,
                      {
                        color:
                          overLimit || text.trim().length === 0
                            ? colors.mutedForeground
                            : colors.primaryForeground,
                      },
                    ]}
                  >
                    Сохранить
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  kvContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  bookName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 120,
    maxHeight: 200,
  },
  counter: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
    minHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  clearLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
