import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export interface MenuItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  /** Show the item in a warning/destructive colour. */
  destructive?: boolean;
  /** Hide the item from the list (keeps the slot stable). */
  hidden?: boolean;
}

interface HeaderMenuProps {
  /** Distance from the top of the screen to where the panel should appear. */
  topOffset: number;
  items: MenuItem[];
}

export function HeaderMenu({ topOffset, items }: HeaderMenuProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const openMenu = () => {
    setOpen(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.92);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = (then?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      then?.();
    });
  };

  const visible = items.filter((it) => !it.hidden);

  return (
    <>
      {/* Burger button */}
      <TouchableOpacity
        style={[styles.burgerBtn, { borderColor: colors.border }]}
        onPress={openMenu}
        activeOpacity={0.75}
        hitSlop={8}
      >
        <Ionicons name="menu" size={22} color={colors.foreground} />
      </TouchableOpacity>

      {/* Dropdown overlay */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => closeMenu()}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={() => closeMenu()}>
          {/* Stop propagation so tapping the panel itself doesn't close */}
          <Pressable onPress={() => {}}>
            <Animated.View
              style={[
                styles.panel,
                {
                  top: topOffset,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.foreground,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {visible.map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => closeMenu(item.onPress)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.destructive ? '#e05c5c' : colors.foreground}
                    />
                    <Text
                      style={[
                        styles.menuLabel,
                        { color: item.destructive ? '#e05c5c' : colors.foreground },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    right: 16,
    minWidth: 210,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    // transform-origin is top-right; scale animates from that corner.
    transformOrigin: 'top right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 18,
  },
});
