/**
 * Semantic design tokens — warm, book-inspired palette.
 * Reference via useColors() hook — never hardcode hex values in components.
 */

const colors = {
  light: {
    text: '#1C1308',
    tint: '#7C4B1E',
    background: '#F5F0E8',
    foreground: '#1C1308',
    card: '#FDFAF4',
    cardForeground: '#1C1308',
    primary: '#7C4B1E',
    primaryForeground: '#FDFAF4',
    secondary: '#EDE5D8',
    secondaryForeground: '#3D2B1A',
    muted: '#EAE3D8',
    mutedForeground: '#9A7B65',
    accent: '#C55B24',
    accentForeground: '#FFFFFF',
    destructive: '#C0392B',
    destructiveForeground: '#FFFFFF',
    border: '#DDD0C3',
    input: '#DDD0C3',
  },
  dark: {
    text: '#F5F0E8',
    tint: '#D4884E',
    background: '#1A1208',
    foreground: '#F5F0E8',
    card: '#261A0E',
    cardForeground: '#F5F0E8',
    primary: '#D4884E',
    primaryForeground: '#1A1208',
    secondary: '#2E2016',
    secondaryForeground: '#EDE5D8',
    muted: '#2E2016',
    mutedForeground: '#9A8070',
    accent: '#E07B4A',
    accentForeground: '#1A1208',
    destructive: '#E05252',
    destructiveForeground: '#FFFFFF',
    border: '#3D2E1E',
    input: '#3D2E1E',
  },
  radius: 12,
};

export default colors;
