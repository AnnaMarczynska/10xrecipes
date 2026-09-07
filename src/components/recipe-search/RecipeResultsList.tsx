import { useEffect, useState } from 'react';
import { RecipeResult } from '../../api/recipeClient';
import { favoriteClient } from '../../api/favoriteClient';
import RecipeCard from '../scaffold/RecipeCard';
import './RecipeResultsList.css';

interface RecipeResultsListProps {
  results: RecipeResult[];
  loading: boolean;
  error: string | null;
  onSelectRecipe: (recipeId: string) => void;
}

export default function RecipeResultsList({
  results,
  loading,
  error,
  onSelectRecipe,
}: RecipeResultsListProps) {
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const data = await favoriteClient.getFavorites();
        const favIds = new Set(data.favorites.map((f) => f.recipeId));
        setFavorited(favIds);
      } catch {
        // Silently fail - favorites list won't load but search continues
      }
    };

    loadFavorites();
  }, []);

  const handleFavoriteToggle = async (
    recipeId: string,
    recipeName: string
  ) => {
    try {
      if (favorited.has(recipeId)) {
        const data = await favoriteClient.getFavorites();
        const favorite = data.favorites.find((f) => f.recipeId === recipeId);
        if (favorite) {
          await favoriteClient.removeFavorite(favorite.id);
          setFavorited((prev) => {
            const next = new Set(prev);
            next.delete(recipeId);
            return next;
          });
          setToastMessage(`Removed ${recipeName} from favorites`);
        }
      } else {
        await favoriteClient.addFavorite(recipeId, recipeName);
        setFavorited((prev) => new Set(prev).add(recipeId));
        setToastMessage(`Added ${recipeName} to favorites`);
      }

      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update favorite';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };
  if (loading) {
    return (
      <div className="results-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-text" />
            <div className="skeleton-text short" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <h2>No recipes found</h2>
        <p>Try removing an ingredient or increasing cook time.</p>
      </div>
    );
  }

  return (
    <>
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
      <div className="results-list">
        {results && results.map((recipe) => {
          if (!recipe || !recipe.id) {
            return null;
          }
          return (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelectRecipe}
              isFavorited={favorited.has(recipe.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          );
        })}
      </div>
    </>
  );
}
