import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { favoriteClient, Favorite } from '../api/favoriteClient';
import RecipeDetail from './RecipeDetailPage';
import '../styles/FavoritesPage.css';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const _navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await favoriteClient.getFavorites();
        const sorted = data.favorites.sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
        setFavorites(sorted);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load favorites'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await favoriteClient.removeFavorite(id);
      setFavorites((prev) => prev.filter((fav) => fav.id !== id));
      setDeletingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete favorite'
      );
      setDeletingId(null);
    }
  };

  if (selectedRecipeId) {
    return (
      <div className="app">
        <header className="app-header">
          <button
            className="back-button"
            onClick={() => setSelectedRecipeId(null)}
            style={{ marginBottom: '10px' }}
          >
            ← Back to Favorites
          </button>
        </header>
        <main className="app-main">
          <RecipeDetail recipeId={selectedRecipeId} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>My Favorites</h1>
        <p>Your saved recipes</p>
      </header>
      <main className="app-main favorites-main">
        {loading && <p className="loading">Loading your favorites...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && favorites.length === 0 && !error && (
          <div className="empty-state">
            <p>You haven&apos;t saved any recipes yet.</p>
            <Link to="/" className="btn btn-primary">
              Start searching
            </Link>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className="favorites-list">
            <p className="favorites-count">
              {favorites.length} recipe{favorites.length !== 1 ? 's' : ''}
              saved
            </p>
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="favorite-item"
                onClick={() => setSelectedRecipeId(favorite.recipeId)}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              >
                <div className="favorite-info">
                  <h3 className="favorite-name">{favorite.recipeName}</h3>
                  {favorite.notes && (
                    <p className="favorite-notes">{favorite.notes}</p>
                  )}
                  <p className="favorite-date">
                    Saved {new Date(favorite.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        'Remove this recipe from your favorites?'
                      )
                    ) {
                      handleDelete(favorite.id);
                    }
                  }}
                  disabled={deletingId === favorite.id}
                  className="btn btn-danger btn-sm"
                  aria-label={`Remove ${favorite.recipeName} from favorites`}
                >
                  {deletingId === favorite.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}

        <Link to="/" className="back-link">
          ← Back to search
        </Link>
      </main>
    </div>
  );
}
