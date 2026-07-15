import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const TABS = [
  { label: 'Хочу прочитать', href: '/shelf' },
  { label: 'Читаю',          href: '/shelf/reading' },
  { label: 'Прочитано',      href: '/shelf/read' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/shelf') return pathname === '/shelf' || pathname === '/shelf/index';
  return pathname.startsWith(href);
}

export default function ShelfLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Top tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <TouchableOpacity
              key={tab.href}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => router.navigate(tab.href)}
            >
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
              {active && <View style={[styles.indicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active screen */}
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
});
