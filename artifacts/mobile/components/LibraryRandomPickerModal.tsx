import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { OpenLibraryBook, pickRandomLibraryBook } from '@/hooks/useOpenLibraryBooks';

interface LibraryRandomPickerModalProps {
  visible: boolean;
  /** Keys to never pick (e.g. already added to "Хочу прочитать"). */
  excludeKeys: Set<string>;
  /** Resolves to true on success; the modal only shows "added" on success. */
  onAddToWantToRead: (book: OpenLibraryBook) => Promise<boolean>;
  onClose: () => void;
}

/** How many past picks to remember and avoid repeating within one session. */
const HISTORY_LIMIT = 8;

export function LibraryRandomPickerModal({
  visible,
  excludeKeys,
  onAddToWantToRead,
  onClose,
}: LibraryRandomPickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [picked, setPicked] = useState<OpenLibraryBook | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const isVisibleRef = useRef(false);
  const addRequestRef = useRef(0);
  const pickRequestRef = useRef(0);
  const recentKeysRef = useRef<string[]>([]);
  const excludeKeysRef = useRef(excludeKeys);

  useEffect(() => {
    excludeKeysRef.current = excludeKeys;
  }, [excludeKeys]);

  const rememberPick = useCallback((book: OpenLibraryBook) => {
    const next = [...recentKeysRef.current, book.key];
    recentKeysRef.current = next.slice(-HISTORY_LIMIT);
  }, []);

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
    stopSpin();
    setSpinning(false);
  }, [stopSpin]);

  useEffect(() => {
    isVisibleRef.current = visible;
  }, [visible]);

  /**
   * Fetches one random book from the whole Open Library catalog and, if
   * this is still the most recent pick request and the modal is still
   * open, applies it as the current pick. `minSpinMs` keeps the shuffle
   * animation visible for a minimum duration so a fast response doesn't
   * feel like a jump-cut.
   */
  const fetchAndApplyPick = useCallback(
    async (minSpinMs: number) => {
      const requestId = ++pickRequestRef.current;
      const exclude = new Set([...excludeKeysRef.current, ...recentKeysRef.current]);
      const startedAt = Date.now();

      const result = await pickRandomLibraryBook(exclude);

      const elapsed = Date.now() - startedAt;
      if (elapsed < minSpinMs) {
        await new Promise((resolve) => setTimeout(resolve, minSpinMs - elapsed));
      }

      // Ignore stale completions: modal may have closed/reopened, or
      // another pick may have been triggered, while this was in flight.
      if (pickRequestRef.current !== requestId || !isVisibleRef.current) return;

      stopSpin();
      setSpinning(false);

      if (!result) {
        setPickFailed(true);
        return;
      }
      setPickFailed(false);
      rememberPick(result);
      setPicked(result);
      revealCard();
    },
    [stopSpin, revealCard, rememberPick]
  );

  useEffect(() => {
    if (visible) {
      setAdded(false);
      setFailed(false);
      setSaving(false);
      setPickFailed(false);
      addRequestRef.current += 1;
      recentKeysRef.current = [];
      setSpinning(true);
      startSpin();
      fetchAndApplyPick(600);
    } else {
      cancelInFlight();
      pickRequestRef.current += 1;
      setSaving(false);
      setPickFailed(false);
      addRequestRef.current += 1;
      setPicked(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    return () => {
      cancelInFlight();
      // Invalidate any in-flight pick/add so a post-unmount resolution
      // can never trigger a state update on this component.
      pickRequestRef.current += 1;
      addRequestRef.current += 1;
    };
  }, [cancelInFlight]);

  const handlePickAgain = useCallback(() => {
    if (spinning || saving) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSpinning(true);
    setAdded(false);
    setFailed(false);
    setPickFailed(false);
    startSpin();

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start();

    fetchAndApplyPick(900);
  }, [spinning, saving, startSpin, cardOpacity, cardTranslateY, fetchAndApplyPick]);

  const handleAdd = useCallback(async () => {
    if (!picked || saving || added) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const requestId = ++addRequestRef.current;
    const submittedBook = picked;
    setSaving(true);
    setFailed(false);
    let ok = false;
    try {
      ok = await onAddToWantToRead(submittedBook);
    } catch {
      ok = false;
    }
    // Ignore stale completions: the modal may have been closed, reopened,
    // or re-picked while this request was in flight.
    if (addRequestRef.current !== requestId) return;
    setSaving(false);
    if (ok) {
      setAdded(true);
    } else {
      setFailed(true);
    }
  }, [picked, saving, added, onAddToWantToRead]);

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

          {picked && !pickFailed && (
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
                {picked.subjects.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagsRow}
                  >
                    {picked.subjects.map((s) => (
                      <View
                        key={s}
                        style={[styles.tag, { backgroundColor: colors.background, borderColor: colors.border }]}
                      >
                        <Text style={[styles.tagText, { color: colors.primary }]} numberOfLines={1}>
                          {s}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </Animated.View>
          )}

          <Text
            style={[
              styles.hint,
              { color: failed || pickFailed ? colors.destructive : colors.mutedForeground },
            ]}
          >
            {spinning
              ? 'Ищем книгу...'
              : pickFailed
              ? 'Не удалось найти книгу. Попробуйте ещё раз'
              : saving
              ? 'Добавляем...'
              : failed
              ? 'Не удалось добавить. Попробуйте ещё раз'
              : added
              ? 'Добавлено в «Хочу прочитать»'
              : 'Не нравится? Попробуйте ещё раз'}
          </Text>

          <View style={styles.actions}>
            {!pickFailed && (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: failed ? colors.destructive : colors.primary,
                    opacity: spinning || saving || added || !picked ? 0.5 : 1,
                  },
                ]}
                onPress={handleAdd}
                activeOpacity={0.85}
                disabled={spinning || saving || added || !picked}
              >
                <Ionicons
                  name={failed ? 'refresh-outline' : 'bookmark-outline'}
                  size={18}
                  color={colors.primaryForeground}
                />
                <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
                  {failed ? 'Повторить' : 'Хочу прочитать'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: colors.primary,
                  opacity: spinning || saving ? 0.4 : 1,
                },
              ]}
              onPress={handlePickAgain}
              activeOpacity={0.75}
              disabled={spinning || saving}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={[styles.secondaryBtnLabel, { color: colors.primary }]}>
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
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  tag: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
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
