import { RecipeResult } from '../api/recipeClient';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: RecipeResult;
  onSelect: (recipeId: string) => void;
  isFavorited?: boolean;
  onFavoriteToggle?: (recipeId: string, recipeName: string) => void;
}

export default function RecipeCard({
  recipe,
  onSelect,
  isFavorited = false,
  onFavoriteToggle,
}: RecipeCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(recipe.id, recipe.name);
  };

  return (
    <div
      className="recipe-card"
      onClick={() => onSelect(recipe.id)}
      role="button"
      tabIndex={0}
    >
      <div className="recipe-image-wrapper">
        <img src={recipe.image} alt={recipe.name} className="recipe-image" />
        {onFavoriteToggle && (
          <button
            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={
              isFavorited
                ? `Remove ${recipe.name} from favorites`
                : `Add ${recipe.name} to favorites`
            }
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className="heart-icon">
              {isFavorited ? '❤️' : '🤍'}
            </span>
          </button>
        )}
      </div>
      <div className="recipe-info">
        <h3 className="recipe-name">{recipe.name}</h3>
        <div className="recipe-meta">
          {recipe.cookTime ? (
            <span className="cook-time">⏱️ {recipe.cookTime} min</span>
          ) : null}
          <span className="match-badge">
            {recipe.matchedIngredientCount} ingredients matched
          </span>
        </div>
        <div className="match-percentage">
          {Math.round(recipe.matchPercentage)}% match
        </div>
      </div>
    </div>
  );
}
