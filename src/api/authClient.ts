import { AxiosError } from 'axios';
import axiosInstance from './interceptor';
import { tokenStorage } from '../utils/tokenStorage';
import { AuthResponse, UserProfile, ApiResponse } from './types';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const apiError = (error.response?.data as ApiResponse<unknown>)?.error;
    return apiError?.message || fallback;
  }
  return fallback;
};

// Re-export types for backward compatibility
export type { AuthResponse, UserProfile, ApiResponse };

export const authClient = {
  signup: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        '/auth/signup',
        { email, password }
      );
      const { data } = response.data;
      if (data.token) {
        tokenStorage.setToken(data.token);
      }
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Signup failed'));
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        { email, password }
      );
      const { data } = response.data;
      if (data.token) {
        tokenStorage.setToken(data.token);
      }
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  },

  logout: async (): Promise<{ status: string }> => {
    try {
      const response = await axiosInstance.get<ApiResponse<{ status: string }>>(
        '/auth/logout'
      );
      tokenStorage.deleteToken();
      return response.data.data;
    } catch (error) {
      tokenStorage.deleteToken();
      throw new Error(getErrorMessage(error, 'Logout failed'));
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await axiosInstance.get<ApiResponse<UserProfile>>(
        '/auth/profile'
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch profile'));
    }
  },
};
