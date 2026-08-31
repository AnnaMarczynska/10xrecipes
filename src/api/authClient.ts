import axiosInstance from './interceptor';
import { tokenStorage } from '../utils/tokenStorage';

export interface AuthResponse {
  token: string;
  email: string;
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  error: null | {
    code: string;
    message: string;
    details?: string;
  };
  status: number;
}

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
    } catch (error: any) {
      const errorResponse = error.response?.data;
      throw new Error(
        errorResponse?.error?.message || 'Signup failed'
      );
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
    } catch (error: any) {
      const errorResponse = error.response?.data;
      throw new Error(
        errorResponse?.error?.message || 'Login failed'
      );
    }
  },

  logout: async (): Promise<{ status: string }> => {
    try {
      const response = await axiosInstance.get<ApiResponse<{ status: string }>>(
        '/auth/logout'
      );
      tokenStorage.deleteToken();
      return response.data.data;
    } catch (error: any) {
      tokenStorage.deleteToken(); // Delete token even if logout fails
      const errorResponse = error.response?.data;
      throw new Error(
        errorResponse?.error?.message || 'Logout failed'
      );
    }
  },

  getProfile: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        '/auth/profile'
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error('Failed to fetch profile');
    }
  },
};
