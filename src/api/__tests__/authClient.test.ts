import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authClient } from '../authClient';
import * as tokenStorage from '../../utils/tokenStorage';

vi.mock('../../utils/tokenStorage');
vi.mock('../interceptor', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should signup with valid credentials and store token', async () => {
      const mockResponse = {
        data: {
          data: { token: 'test-token', email: 'test@example.com' },
          error: null,
          status: 200,
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.post).mockResolvedValue(mockResponse);

      const result = await authClient.signup('test@example.com', 'password123');

      expect(result.token).toBe('test-token');
      expect(result.email).toBe('test@example.com');
      expect(tokenStorage.tokenStorage.setToken).toHaveBeenCalledWith('test-token');
    });

    it('should throw error on signup failure', async () => {
      const error = new Error('Email already registered');
      (error as any).response = {
        data: {
          error: { message: 'Email already registered' },
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.post).mockRejectedValue(error);

      await expect(authClient.signup('test@example.com', 'password123')).rejects.toThrow(
        'Email already registered'
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials and store token', async () => {
      const mockResponse = {
        data: {
          data: { token: 'test-token', email: 'test@example.com' },
          error: null,
          status: 200,
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.post).mockResolvedValue(mockResponse);

      const result = await authClient.login('test@example.com', 'password123');

      expect(result.token).toBe('test-token');
      expect(result.email).toBe('test@example.com');
      expect(tokenStorage.tokenStorage.setToken).toHaveBeenCalledWith('test-token');
    });

    it('should throw error on invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      (error as any).response = {
        data: {
          error: { message: 'Invalid credentials' },
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.post).mockRejectedValue(error);

      await expect(authClient.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('logout', () => {
    it('should logout and delete token', async () => {
      const mockResponse = {
        data: {
          data: { status: 'success' },
          error: null,
          status: 200,
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.get).mockResolvedValue(mockResponse);

      await authClient.logout();

      expect(tokenStorage.tokenStorage.deleteToken).toHaveBeenCalled();
    });

    it('should delete token even on logout error', async () => {
      const errorResponse = {
        response: {
          data: {
            error: { message: 'Logout failed' },
          },
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.get).mockRejectedValue(errorResponse);

      await expect(authClient.logout()).rejects.toThrow('Logout failed');
      expect(tokenStorage.tokenStorage.deleteToken).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile', async () => {
      const mockResponse = {
        data: {
          data: { email: 'test@example.com', id: '123' },
          error: null,
          status: 200,
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.get).mockResolvedValue(mockResponse);

      const result = await authClient.getProfile();

      expect(result.email).toBe('test@example.com');
      expect(result.id).toBe('123');
    });

    it('should throw error if profile fetch fails', async () => {
      const errorResponse = {
        response: {
          data: {
            error: { message: 'Unauthorized' },
          },
        },
      };

      const interceptor = await import('../interceptor');
      vi.mocked(interceptor.default.get).mockRejectedValue(errorResponse);

      await expect(authClient.getProfile()).rejects.toThrow('Failed to fetch profile');
    });
  });
});
