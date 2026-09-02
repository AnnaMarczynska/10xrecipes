import { AxiosError } from 'axios';
import axiosInstance from './interceptor';

export interface Favorite {
  id: number;
  recipeId: string;
  recipeName: string;
  notes: string | null;
  addedAt: string;
}

export interface FavoritesListResponse {
  favorites: Favorite[];
  total: number;
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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const apiError = (error.response?.data as ApiResponse<unknown>)?.error;
    return apiError?.message || fallback;
  }
  return fallback;
};

export const favoriteClient = {
  addFavorite: async (
    recipeId: string,
    recipeName: string
  ): Promise<Favorite> => {
    try {
      const response = await axiosInstance.post<ApiResponse<Favorite>>(
        '/favorites',
        { recipeId, recipeName }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to add favorite'));
    }
  },

  getFavorites: async (): Promise<FavoritesListResponse> => {
    try {
      const response = await axiosInstance.get<
        ApiResponse<FavoritesListResponse>
      >('/favorites');
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch favorites'));
    }
  },

  removeFavorite: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete<ApiResponse<null>>(`/favorites/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to remove favorite'));
    }
  },

  isFavorite: async (recipeId: string): Promise<boolean> => {
    try {
      const response = await favoriteClient.getFavorites();
      return response.favorites.some((fav) => fav.recipeId === recipeId);
    } catch {
      return false;
    }
  },
};
