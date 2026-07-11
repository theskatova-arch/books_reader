import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  GestureResponderEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TutorialSpotlightProps {
  visible: boolean;
  /** Screen-relative bounding box of the element to highlight. */
  targetRect: SpotlightRect | null;
  text: string;
  /** Called when the user taps the highlighted element area. */
  onConfirm: () => void;
  /** Called when the user taps "Пропустить". */
  onSkip: () => void;
}

const OVERLAY = 'rgba(0,0,0,0.78)';
const PAD = 10;

export function TutorialSpotlight({
  visible,
  targetRect,
  text,
  onConfirm,
  onSkip,
}: TutorialSpotlightProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!visible || !targetRect) {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      pulseRef.current?.stop();
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseRef.current.start();

    return () => {
      pulseRef.current?.stop();
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    };
  }, [visible, targetRect, fadeAnim, pulseAnim]);

  if (!visible || !targetRect) return null;

  const { width: SW, height: SH } = Dimensions.get('window');
  const { x, y, width, height } = targetRect;

  const hx = x - PAD;
  const hy = y - PAD;
  const hw = width + PAD * 2;
  const hh = height + PAD * 2;
  const hRadius = height / 2 + PAD + 4;

  const tooltipBelow = hy + hh + 16 + 100 < SH;
  const tooltipTop = tooltipBelow ? hy + hh + 12 : hy - 12 - 100;
  const buttonOnRight = hx + hw / 2 > SW / 2;

  /** Route the full-screen tap: hole → confirm, elsewhere → ignore */
  const handleScreenPress = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    if (pageX >= hx && pageX <= hx + hw && pageY >= hy && pageY <= hy + hh) {
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>

        {/* ── Visual layer (non-interactive) ── */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Four dark rectangles leaving a hole */}
          <View style={[styles.dark, { top: 0, left: 0, right: 0, height: Math.max(0, hy) }]} />
          <View style={[styles.dark, { top: hy + hh, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.dark, { top: hy, left: 0, width: Math.max(0, hx), height: hh }]} />
          <View style={[styles.dark, { top: hy, left: hx + hw, right: 0, height: hh }]} />

          {/* Glowing ring around the hole */}
          <Animated.View
            style={[
              styles.ring,
              {
                left: hx,
                top: hy,
                width: hw,
                height: hh,
                borderRadius: hRadius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Tooltip */}
          <View
            style={[
              styles.tooltip,
              {
                top: tooltipTop,
                left: 16,
                right: 16,
              },
            ]}
          >
            <View style={[styles.arrowRow, { justifyContent: buttonOnRight ? 'flex-end' : 'flex-start' }]}>
              <View style={styles.arrowIcon}>
                <Ionicons
                  name={tooltipBelow ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color="white"
                />
              </View>
            </View>
            <View style={[styles.bubble, { alignSelf: buttonOnRight ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.bubbleText}>{text}</Text>
            </View>
          </View>
        </View>

        {/* ── Touch layer: full-screen tap with coordinate check ── */}
        {/* Rendered AFTER visual layer so it sits on top and receives touches */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleScreenPress} />

        {/* ── Skip button: rendered last so it's on top of the Pressable ── */}
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.75}>
          <Text style={styles.skipLabel}>Пропустить</Text>
        </TouchableOpacity>

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dark: {
    position: 'absolute',
    backgroundColor: OVERLAY,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
  },
  arrowRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  arrowIcon: {
    marginHorizontal: 4,
  },
  bubble: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#111',
    lineHeight: 22,
  },
  skipBtn: {
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
});
