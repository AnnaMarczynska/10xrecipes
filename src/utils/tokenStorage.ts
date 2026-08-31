const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  deleteToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  isTokenValid: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token !== null && token.trim().length > 0;
  },

  getAuthHeader: (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  },
};
