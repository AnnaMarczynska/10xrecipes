import { RecipeResult } from '../api/recipeClient';
import RecipeCard from './RecipeCard';
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
    <div className="results-list">
      {results.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onSelect={onSelectRecipe}
        />
      ))}
    </div>
  );
}
