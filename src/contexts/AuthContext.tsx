'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { HARDCODED_CREDENTIALS } from '@/lib/auth-config';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay una sesión activa
    const authCookie = Cookies.get('auth');
    const userCookie = Cookies.get('user');

    if (authCookie && userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        setUser(userData);
      } catch {
        Cookies.remove('auth');
        Cookies.remove('user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Validar credenciales hardcodeadas
    if (
      email === HARDCODED_CREDENTIALS.email &&
      password === HARDCODED_CREDENTIALS.password
    ) {
      const userData: User = {
        email,
        name: 'Administrador',
      };

      // Guardar en cookies
      Cookies.set('auth', 'true', { expires: 7 });
      Cookies.set('user', JSON.stringify(userData), { expires: 7 });

      setUser(userData);
      router.push('/');
      return true;
    }

    return false;
  }, [router]);

  const logout = useCallback(() => {
    Cookies.remove('auth');
    Cookies.remove('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
