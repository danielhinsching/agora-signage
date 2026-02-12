import { useCallback, useEffect, useState } from 'react';
import { User } from '@/types';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          username: firebaseUser.email || firebaseUser.displayName || 'Usuário',
          isAuthenticated: true,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error codes
      if (error.code === 'auth/invalid-credential') {
        toast.error('Email ou senha incorretos');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('Usuário não encontrado');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Senha incorreta');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Muitas tentativas. Tente novamente mais tarde');
      } else {
        toast.error('Erro ao fazer login');
      }
      
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Logout realizado!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: user?.isAuthenticated ?? false,
    login,
    logout,
  };
}
