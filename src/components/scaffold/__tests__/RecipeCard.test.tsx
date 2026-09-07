import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeCard from '../RecipeCard';
import { RecipeResult } from '../../../api/recipeClient';

const mockRecipe: RecipeResult = {
  id: '52850',
  name: 'Chicken Couscous',
  image: 'https://www.themealdb.com/images/media/meals/qxytrx1511304021.jpg',
  cookTime: 18,
  matchedIngredientCount: 1,
  matchPercentage: 100,
  score: 100.0,
};

describe('RecipeCard', () => {
  it('should render recipe information', () => {
    const mockOnSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();

    render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    expect(screen.getByText('Chicken Couscous')).toBeTruthy();
    expect(screen.getByText('18 min')).toBeTruthy();
    expect(screen.getByText('1 ingredients matched')).toBeTruthy();
    expect(screen.getByText('100% match')).toBeTruthy();
  });

  it('should show outline heart icon when not favorited', () => {
    const mockOnSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();

    render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const heartIcon = screen.getByText('🤍');
    expect(heartIcon).toBeTruthy();
  });

  it('should show filled heart icon when favorited', () => {
    const mockOnSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();

    render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
        isFavorited={true}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const heartIcon = screen.getByText('❤️');
    expect(heartIcon).toBeTruthy();
  });

  it('should call onFavoriteToggle when heart button clicked', () => {
    const mockOnSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();

    render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const heartButton = screen.getByRole('button', {
      name: /Add Chicken Couscous to favorites/i,
    });
    fireEvent.click(heartButton);

    expect(mockOnFavoriteToggle).toHaveBeenCalledWith('52850', 'Chicken Couscous');
  });

  it('should call onSelect when recipe card clicked', () => {
    const mockOnSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();

    const { container } = render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const card = container.querySelector('.recipe-card');
    fireEvent.click(card!);

    expect(mockOnSelect).toHaveBeenCalledWith('52850');
  });

  it('should not call onSelect when heart button clicked', () => {
    const mockOnSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();

    render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const heartButton = screen.getByRole('button', {
      name: /Add Chicken Couscous to favorites/i,
    });
    fireEvent.click(heartButton);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should render without favorite button when onFavoriteToggle not provided', () => {
    const mockOnSelect = vi.fn();

    render(
      <RecipeCard
        recipe={mockRecipe}
        onSelect={mockOnSelect}
      />
    );

    const heartButtons = screen.queryAllByRole('button', {
      name: /favorites/i,
    });
    expect(heartButtons.length).toBe(0);
  });
});
