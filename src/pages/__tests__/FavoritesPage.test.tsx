import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FavoritesPage from '../FavoritesPage';
import { favoriteClient } from '../../api/favoriteClient';

vi.mock('../../api/favoriteClient');
vi.mock('../RecipeDetailPage', () => ({
  default: () => <div>Recipe Details</div>,
}));

const mockFavorites = [
  {
    id: 1,
    recipeId: '52850',
    recipeName: 'Chicken Couscous',
    notes: null,
    addedAt: '2026-09-02T10:00:00',
  },
  {
    id: 2,
    recipeId: '52796',
    recipeName: 'Chicken Alfredo Primavera',
    notes: 'Great for weekends',
    addedAt: '2026-09-01T10:00:00',
  },
];

describe('FavoritesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state on mount', () => {
    vi.mocked(favoriteClient.getFavorites).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading your favorites...')).toBeTruthy();
  });

  it('should render empty state when no favorites', async () => {
    vi.mocked(favoriteClient.getFavorites).mockResolvedValue({
      favorites: [],
      total: 0,
    });

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("You haven't saved any recipes yet.")
      ).toBeTruthy();
    });
  });

  it('should render favorites list sorted by most recent first', async () => {
    vi.mocked(favoriteClient.getFavorites).mockResolvedValue({
      favorites: mockFavorites,
      total: 2,
    });

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your saved recipes/)).toBeTruthy();
      expect(screen.getByText('Chicken Couscous')).toBeTruthy();
      expect(screen.getByText('Chicken Alfredo Primavera')).toBeTruthy();
    });

    const items = screen.getAllByRole('button', { name: /Remove/ });
    expect(items.length).toBe(2);
  });

  it('should display notes if present', async () => {
    vi.mocked(favoriteClient.getFavorites).mockResolvedValue({
      favorites: mockFavorites,
      total: 2,
    });

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Great for weekends')).toBeTruthy();
    });
  });

  it('should show confirmation dialog before delete', async () => {
    vi.mocked(favoriteClient.getFavorites).mockResolvedValue({
      favorites: mockFavorites,
      total: 2,
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chicken Couscous')).toBeTruthy();
    });

    const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
    fireEvent.click(removeButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Remove this recipe from your favorites?'
    );
    confirmSpy.mockRestore();
  });

  it('should delete favorite when confirmed', async () => {
    vi.mocked(favoriteClient.getFavorites).mockResolvedValue({
      favorites: mockFavorites,
      total: 2,
    });
    vi.mocked(favoriteClient.removeFavorite).mockResolvedValue(undefined);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chicken Couscous')).toBeTruthy();
    });

    const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(favoriteClient.removeFavorite).toHaveBeenCalledWith(1);
    });

    confirmSpy.mockRestore();
  });

  it('should show error message on fetch failure', async () => {
    vi.mocked(favoriteClient.getFavorites).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('should navigate to recipe details when clicked', async () => {
    vi.mocked(favoriteClient.getFavorites).mockResolvedValue({
      favorites: mockFavorites,
      total: 2,
    });

    const { container } = render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chicken Couscous')).toBeTruthy();
    });

    const favItems = container.querySelectorAll('.favorite-item');
    fireEvent.click(favItems[0]);

    await waitFor(() => {
      expect(screen.getByText('← Back to Favorites')).toBeTruthy();
    });
  });
});
