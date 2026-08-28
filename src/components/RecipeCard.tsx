import { RecipeResult } from '../api/recipeClient';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: RecipeResult;
  onSelect: (recipeId: string) => void;
}

export default function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  return (
    <div
      className="recipe-card"
      onClick={() => onSelect(recipe.id)}
      role="button"
      tabIndex={0}
    >
      <div className="recipe-image-wrapper">
        <img src={recipe.image} alt={recipe.name} className="recipe-image" />
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
