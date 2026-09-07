/**
 * Token Storage Utilities
 *
 * Manages JWT token persistence in browser localStorage.
 * Tokens are stored as plain text and auto-injected into API requests.
 *
 * Note: localStorage survives page refreshes but not browser tab closure (session).
 * For persistent login across browser restarts, use httpOnly cookies (requires backend support).
 *
 * @example
 * // Store token after login
 * const response = await authClient.login(email, password);
 * tokenStorage.setToken(response.token);
 *
 * @example
 * // Retrieve token for manual requests
 * const token = tokenStorage.getToken();
 * const headers = tokenStorage.getAuthHeader(); // { Authorization: "Bearer ..." }
 *
 * @example
 * // Clear token on logout
 * tokenStorage.deleteToken();
 */

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  /**
   * Store JWT token in localStorage.
   * @param token JWT token from /auth/login or /auth/signup
   */
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Retrieve JWT token from localStorage.
   * @returns Token string or null if not found
   */
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Delete JWT token from localStorage (logout).
   */
  deleteToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if token exists and is non-empty.
   * @returns true if token is present and valid, false otherwise
   */
  isTokenValid: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token !== null && token.trim().length > 0;
  },

  /**
   * Get Authorization header for HTTP requests.
   * Used by axios interceptor (interceptor.ts) to auto-inject token.
   * @returns Object with Authorization header, or empty object if no token
   * @example
   * { Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..." }
   */
  getAuthHeader: (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  },
};
