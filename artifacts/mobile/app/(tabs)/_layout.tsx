import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const TABS = [
  {
    href: '/library',
    icon: 'book-outline' as const,
    iconActive: 'book' as const,
    label: 'Библиотека',
  },
  {
    href: '/shelf',
    icon: 'albums-outline' as const,
    iconActive: 'albums' as const,
    label: 'Полка',
  },
  {
    href: '/room',
    icon: 'home-outline' as const,
    iconActive: 'home' as const,
    label: 'Комната',
  },
  {
    href: '/feed',
    icon: 'people-outline' as const,
    iconActive: 'people' as const,
    label: 'Лента',
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/shelf') return pathname === '/shelf' || pathname.startsWith('/shelf/');
  return pathname === href || pathname.startsWith(href + '/');
}

export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Slot />
      <View
        style={[
          styles.tabBar,
          {
            paddingBottom: isWeb ? 8 : insets.bottom,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <TouchableOpacity
              key={tab.href}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => router.navigate(tab.href)}
            >
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={26}
                color={active ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
