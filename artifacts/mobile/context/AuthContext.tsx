import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setAuthToken } from '@/lib/api';

const TOKEN_KEY = '@booktracker_auth_token';
const USERNAME_KEY = '@booktracker_auth_username';

interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    username: null,
    isLoading: true,
  });

  // Restore persisted session on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, username] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USERNAME_KEY),
        ]);
        if (token && username) {
          setAuthToken(token);
          setState({ token, username, isLoading: false });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const persist = useCallback(async (token: string, username: string) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USERNAME_KEY, username),
    ]);
    setAuthToken(token);
    setState({ token, username, isLoading: false });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.login(username, password);
      await persist(res.token, res.username);
    },
    [persist],
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.register(username, password);
      await persist(res.token, res.username);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USERNAME_KEY),
    ]);
    setAuthToken(null);
    setState({ token: null, username: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
