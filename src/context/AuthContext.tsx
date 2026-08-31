import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokenStorage } from '../utils/tokenStorage';
import { authClient, UserProfile } from '../api/authClient';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (email: string, token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenStorage.getToken();
      if (token) {
        try {
          const profile = await authClient.getProfile();
          setUser(profile);
          setIsLoggedIn(true);
        } catch (error) {
          tokenStorage.deleteToken();
          setIsLoggedIn(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (email: string, token: string) => {
    tokenStorage.setToken(token);
    setUser({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    try {
      await authClient.logout();
    } catch (error) {
      console.error('Logout error (token will still be deleted)', error);
    } finally {
      tokenStorage.deleteToken();
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
