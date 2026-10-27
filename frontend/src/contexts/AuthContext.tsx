'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/services/api';

export interface User {
  id: string;
  nome: string;
  email: string;
  criado_em: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      await Promise.resolve();
      const storedToken = localStorage.getItem('seha_token');
      try {
        if (storedToken) {
          const userData = await apiFetch<User>('/api/auth/me');
          if (active) {
            setToken(storedToken);
            setUser(userData);
          }
        }
      } catch {
        localStorage.removeItem('seha_token');
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, []);

  const login = async (email: string, senha: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });

    localStorage.setItem('seha_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (nome: string, email: string, senha: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });

    localStorage.setItem('seha_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('seha_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
