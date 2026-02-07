import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { User, STORAGE_KEYS } from '@/types';

const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'agora2024',
};

export function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>(STORAGE_KEYS.USER, null);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      setUser({ username, isAuthenticated: true });
      return true;
    }
    return false;
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  return {
    user,
    isAuthenticated: user?.isAuthenticated ?? false,
    login,
    logout,
  };
}
