import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
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
  targetRect: SpotlightRect | null;
  text: string;
  onConfirm: () => void;
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
      duration: 280,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      {/*
       * VISUAL LAYER — pointerEvents="none" so touches fall through
       * to the siblings below (hole target + skip button).
       */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
      >
        {/* Four dark rects leaving the hole transparent */}
        <View style={[styles.dark, { top: 0, left: 0, right: 0, height: Math.max(0, hy) }]} />
        <View style={[styles.dark, { top: hy + hh, left: 0, right: 0, bottom: 0 }]} />
        <View style={[styles.dark, { top: hy, left: 0, width: Math.max(0, hx), height: hh }]} />
        <View style={[styles.dark, { top: hy, left: hx + hw, right: 0, height: hh }]} />

        {/* Pulsing glow ring */}
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
            styles.tooltipWrap,
            { top: tooltipTop, left: 16, right: 16 },
          ]}
        >
          <View
            style={[
              styles.arrowRow,
              { justifyContent: buttonOnRight ? 'flex-end' : 'flex-start' },
            ]}
          >
            <Ionicons
              name={tooltipBelow ? 'arrow-up' : 'arrow-down'}
              size={16}
              color="white"
            />
          </View>
          <View
            style={[
              styles.bubble,
              { alignSelf: buttonOnRight ? 'flex-end' : 'flex-start' },
            ]}
          >
            <Text style={styles.bubbleText}>{text}</Text>
          </View>
        </View>
      </Animated.View>

      {/*
       * HOLE TAP TARGET — direct child of Modal root (not nested inside
       * any Animated.View), positioned exactly over the highlighted button.
       * This is the most reliable placement for touch handling in RN.
       */}
      <TouchableOpacity
        style={[
          styles.holeTarget,
          { left: hx, top: hy, width: hw, height: hh, borderRadius: hRadius },
        ]}
        onPress={onConfirm}
        activeOpacity={0.85}
      />

      {/*
       * SKIP BUTTON — also a direct child of Modal root, rendered after
       * the hole target (higher z-order) so it always receives its taps.
       */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.skipWrap, { opacity: fadeAnim }]}
      >
        <TouchableOpacity onPress={onSkip} activeOpacity={0.7} hitSlop={12}>
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
  tooltipWrap: {
    position: 'absolute',
  },
  arrowRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginBottom: 2,
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
  /** Transparent tap target positioned exactly over the highlighted element */
  holeTarget: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  skipWrap: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skipLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
