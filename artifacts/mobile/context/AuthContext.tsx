import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiJSON } from '@/lib/api';

const TOKEN_KEY = '@auth:token';
const USERNAME_KEY = '@auth:username';

export interface AuthUser {
  username: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, username] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USERNAME_KEY),
        ]);
        if (token && username) setUser({ token, username });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveSession = useCallback(async (token: string, username: string) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USERNAME_KEY, username),
    ]);
    setUser({ token, username });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiJSON<{ token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    await saveSession(data.token, data.username);
  }, [saveSession]);

  const register = useCallback(async (username: string, password: string) => {
    const data = await apiJSON<{ token: string; username: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    await saveSession(data.token, data.username);
  }, [saveSession]);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USERNAME_KEY),
    ]);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
