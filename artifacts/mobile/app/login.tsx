import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  async function handleSubmit() {
    setError(null);

    const u = username.trim();
    if (u.length < 2) {
      setError('Имя пользователя должно содержать минимум 2 символа');
      return;
    }
    if (password.length < 3 || password.length > 6) {
      setError('Пароль должен содержать от 3 до 6 символов');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(u, password);
      } else {
        await login(u, password);
      }
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  const styles = makeStyles(colors, insets.top, insets.bottom);

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.bookEmoji}>📚</Text>
            <Text style={styles.appName}>Книжная полка</Text>
            <Text style={styles.tagline}>Ваши книги, ваш список</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tab switcher */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'login' && styles.tabActive]}
                onPress={() => { setMode('login'); setError(null); }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    mode === 'login' && styles.tabLabelActive,
                  ]}
                >
                  Вход
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'register' && styles.tabActive]}
                onPress={() => { setMode('register'); setError(null); }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    mode === 'register' && styles.tabLabelActive,
                  ]}
                >
                  Регистрация
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fields */}
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.label}>Имя пользователя</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите имя"
                  placeholderTextColor={colors.mutedForeground}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Пароль{' '}
                  <Text style={styles.hint}>(3–6 символов)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите пароль"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.submitLabel}>
                  {isRegister ? 'Создать аккаунт' : 'Войти'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch mode link */}
            <Pressable
              style={styles.switchRow}
              onPress={() => { setMode(isRegister ? 'login' : 'register'); setError(null); }}
            >
              <Text style={styles.switchText}>
                {isRegister
                  ? 'Уже есть аккаунт? '
                  : 'Нет аккаунта? '}
                <Text style={styles.switchLink}>
                  {isRegister ? 'Войти' : 'Зарегистрироваться'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  topInset: number,
  bottomInset: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: topInset + 24,
      paddingBottom: bottomInset + 32,
      paddingHorizontal: 20,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 36,
    },
    bookEmoji: {
      fontSize: 56,
      marginBottom: 12,
    },
    appName: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 6,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius * 1.5,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      padding: 4,
      marginBottom: 24,
    },
    tab: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: colors.radius - 2,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabLabel: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    tabLabelActive: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    fields: {
      gap: 16,
      marginBottom: 16,
    },
    field: {
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.foreground,
    },
    hint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    errorBox: {
      backgroundColor: '#FEE2E2',
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: '#B91C1C',
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitLabel: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
    },
    switchRow: {
      alignItems: 'center',
      marginTop: 18,
    },
    switchText: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    switchLink: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
  });
}
