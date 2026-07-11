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
  /** Screen-relative bounding box of the element to highlight. */
  targetRect: SpotlightRect | null;
  text: string;
  /** Called when the user taps the highlighted element. */
  onConfirm: () => void;
  /** Called when the user taps "Пропустить". */
  onSkip: () => void;
}

const OVERLAY = 'rgba(0,0,0,0.78)';
const PAD = 10; // extra padding around the highlighted element

export function TutorialSpotlight({
  visible,
  targetRect,
  text,
  onConfirm,
  onSkip,
}: TutorialSpotlightProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !targetRect) return;

    // Fade in overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse the spotlight hole
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
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
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
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
  const hRadius = (height / 2) + PAD + 4;

  // Tooltip position — show below the button if there's space, else above
  const tooltipBelow = hy + hh + 16 + 90 < SH;
  const tooltipTop = tooltipBelow ? hy + hh + 16 : hy - 16 - 90;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        {/* Four dark rectangles forming the spotlight "hole" */}
        {/* Top */}
        <View style={[styles.dark, { top: 0, left: 0, right: 0, height: Math.max(0, hy) }]} />
        {/* Bottom */}
        <View style={[styles.dark, { top: hy + hh, left: 0, right: 0, bottom: 0 }]} />
        {/* Left */}
        <View style={[styles.dark, { top: hy, left: 0, width: Math.max(0, hx), height: hh }]} />
        {/* Right */}
        <View style={[styles.dark, { top: hy, left: hx + hw, right: 0, height: hh }]} />

        {/* Highlight ring + tap target */}
        <Animated.View
          style={[
            styles.hole,
            {
              left: hx,
              top: hy,
              width: hw,
              height: hh,
              borderRadius: hRadius,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onConfirm}
            activeOpacity={0.85}
          />
        </Animated.View>

        {/* Tooltip */}
        <View
          style={[
            styles.tooltip,
            {
              top: tooltipTop,
              left: 16,
              right: 16,
              alignItems: hx + hw / 2 > SW / 2 ? 'flex-end' : 'flex-start',
            },
          ]}
          pointerEvents="none"
        >
          {/* Arrow pointing up or down toward the button */}
          <View
            style={[
              styles.arrowWrap,
              tooltipBelow ? styles.arrowTop : styles.arrowBottom,
              { alignSelf: hx + hw / 2 > SW / 2 ? 'flex-end' : 'flex-start', marginHorizontal: 20 },
            ]}
          >
            <Ionicons
              name={tooltipBelow ? 'arrow-up' : 'arrow-down'}
              size={18}
              color="white"
            />
          </View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{text}</Text>
          </View>
        </View>

        {/* Skip button */}
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
  hole: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    // transparent fill so the button behind is visible
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
  },
  arrowWrap: {
    marginBottom: 2,
  },
  arrowTop: {},
  arrowBottom: {},
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
});
