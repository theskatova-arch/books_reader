import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { OpenLibraryBook } from '@/hooks/useOpenLibraryBooks';

interface LibraryRandomPickerModalProps {
  visible: boolean;
  books: OpenLibraryBook[];
  onAddToWantToRead: (book: OpenLibraryBook) => void;
  onClose: () => void;
}

function pickRandom(books: OpenLibraryBook[], exclude?: OpenLibraryBook): OpenLibraryBook {
  if (books.length === 1) return books[0]!;
  const filtered = exclude ? books.filter((b) => b.key !== exclude.key) : books;
  const pool = filtered.length > 0 ? filtered : books;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function LibraryRandomPickerModal({
  visible,
  books,
  onAddToWantToRead,
  onClose,
}: LibraryRandomPickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [picked, setPicked] = useState<OpenLibraryBook | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [added, setAdded] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(false);

  const revealCard = useCallback(() => {
    cardOpacity.setValue(0);
    cardTranslateY.setValue(24);
    cardScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY, cardScale]);

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.current.start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinLoop.current?.stop();
    spinAnim.setValue(0);
  }, [spinAnim]);

  const cancelInFlight = useCallback(() => {
    if (pickTimerRef.current != null) {
      clearTimeout(pickTimerRef.current);
      pickTimerRef.current = null;
    }
    stopSpin();
    setSpinning(false);
  }, [stopSpin]);

  useEffect(() => {
    isVisibleRef.current = visible;
  }, [visible]);

  const booksRef = useRef(books);
  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    if (visible) {
      setAdded(false);
      if (booksRef.current.length > 0) {
        const first = pickRandom(booksRef.current);
        setPicked(first);
        revealCard();
      }
    } else {
      cancelInFlight();
      setPicked(null);
    }
  }, [visible, revealCard, cancelInFlight]);

  useEffect(() => {
    return () => {
      cancelInFlight();
    };
  }, [cancelInFlight]);

  const handlePickAgain = useCallback(() => {
    if (spinning || booksRef.current.length < 2) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSpinning(true);
    setAdded(false);
    startSpin();

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start();

    const currentPicked = picked;

    pickTimerRef.current = setTimeout(() => {
      pickTimerRef.current = null;
      if (!isVisibleRef.current) return;
      stopSpin();
      const next = pickRandom(booksRef.current, currentPicked ?? undefined);
      setPicked(next);
      setSpinning(false);
      revealCard();
    }, 900);
  }, [spinning, picked, startSpin, stopSpin, revealCard, cardOpacity, cardTranslateY]);

  const handleAdd = useCallback(() => {
    if (!picked) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAddToWantToRead(picked);
    setAdded(true);
  }, [picked, onAddToWantToRead]);

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const canPickAgain = books.length >= 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shuffle" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.foreground }]}>
                Случайная книга
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.spinnerWrap,
              { transform: [{ rotate: spinRotate }], opacity: spinning ? 1 : 0 },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="dice-outline" size={36} color={colors.primary} />
          </Animated.View>

          {picked && (
            <Animated.View
              style={[
                styles.bookCard,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
                },
              ]}
            >
              <View style={[styles.spineAccent, { backgroundColor: colors.primary }]} />

              <View style={styles.bookBody}>
                <Text
                  style={[styles.bookTitle, { color: colors.foreground }]}
                  numberOfLines={3}
                >
                  {picked.title}
                </Text>
                {picked.author ? (
                  <Text
                    style={[styles.bookAuthor, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {picked.author}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          )}

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {spinning
              ? 'Ищем книгу...'
              : added
              ? 'Добавлено в «Хочу прочитать»'
              : canPickAgain
              ? 'Не нравится? Попробуйте ещё раз'
              : 'В списке только одна книга'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, opacity: spinning || added ? 0.5 : 1 },
              ]}
              onPress={handleAdd}
              activeOpacity={0.85}
              disabled={spinning || added}
            >
              <Ionicons name="bookmark-outline" size={18} color={colors.primaryForeground} />
              <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
                Хочу прочитать
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: canPickAgain ? colors.primary : colors.border,
                  opacity: spinning || !canPickAgain ? 0.4 : 1,
                },
              ]}
              onPress={handlePickAgain}
              activeOpacity={0.75}
              disabled={spinning || !canPickAgain}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={canPickAgain ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.secondaryBtnLabel,
                  { color: canPickAgain ? colors.primary : colors.mutedForeground },
                ]}
              >
                Искать снова
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  spinnerWrap: {
    alignSelf: 'center',
    position: 'absolute',
    top: 120,
  },
  bookCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 110,
  },
  spineAccent: {
    width: 5,
  },
  bookBody: {
    flex: 1,
    padding: 18,
    gap: 8,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },
  bookAuthor: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
  },
  secondaryBtnLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
