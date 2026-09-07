/**
 * Authentication Context
 *
 * Manages global auth state across the app: current user, login/logout, token management.
 * Auto-initializes on app load by checking localStorage for persisted token.
 *
 * When to use: Any component that needs to know if user is logged in or access user data.
 *
 * @example
 * // In your component
 * const { isLoggedIn, user, login, logout } = useAuth();
 *
 * if (isLoggedIn) {
 *   <div>Logged in as {user?.email}</div>
 * }
 *
 * @example
 * // Guard protected routes
 * <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
 * // ProtectedRoute uses useAuth() to check isLoggedIn
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokenStorage } from '../utils/tokenStorage';
import { authClient, UserProfile } from '../api/authClient';

/**
 * Authentication context value type.
 * Provides user state and auth actions to components.
 */
interface AuthContextType {
  /** Current user profile { email }, or null if not logged in */
  user: UserProfile | null;
  /** Whether user is currently authenticated */
  isLoggedIn: boolean;
  /** Store user + token after login (called by LoginPage/SignupPage) */
  login: (email: string, token: string) => void;
  /** Clear user + token on logout */
  logout: () => Promise<void>;
  /** true while checking stored token on app init, false once done */
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider: Wraps app to provide authentication context.
 * Must be placed at app root (above Router).
 *
 * On init, checks localStorage for persisted token and fetches user profile.
 * If token invalid or fetch fails, clears it and starts unauthenticated.
 *
 * @example
 * <AuthProvider>
 *   <Router>
 *     <Routes>...</Routes>
 *   </Router>
 * </AuthProvider>
 */
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

/**
 * useAuth Hook: Access authentication state and actions.
 *
 * Must be called within a component wrapped by AuthProvider.
 * Throws error if used outside provider context.
 *
 * @returns AuthContextType with { user, isLoggedIn, loading, login(), logout() }
 *
 * @example
 * const { isLoggedIn, user } = useAuth();
 * if (isLoggedIn) {
 *   return <div>Welcome {user?.email}</div>;
 * }
 * return <div>Please log in</div>;
 *
 * @example
 * const { logout } = useAuth();
 * <button onClick={() => logout()}>Log Out</button>
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
