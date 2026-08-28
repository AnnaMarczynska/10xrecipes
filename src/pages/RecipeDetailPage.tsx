import { useState, useEffect } from 'react';
import { getRecipeDetails, RecipeDetail } from '../api/recipeClient';
import './RecipeDetailPage.css';

interface RecipeDetailPageProps {
  recipeId: string;
}

export default function RecipeDetailPage({
  recipeId,
}: RecipeDetailPageProps) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getRecipeDetails(recipeId)
      .then(setRecipe)
      .catch(() => setError('Failed to load recipe details'))
      .finally(() => setLoading(false));
  }, [recipeId]);

  if (loading) {
    return <div className="loading">Loading recipe details...</div>;
  }

  if (error || !recipe) {
    return <div className="error-message">{error || 'Recipe not found'}</div>;
  }

  return (
    <div className="recipe-detail">
      <img src={recipe.image} alt={recipe.name} className="detail-image" />
      <h1 className="detail-title">{recipe.name}</h1>

      <div className="detail-meta">
        {recipe.cookTime && <span>⏱️ {recipe.cookTime} min</span>}
      </div>

      <section className="ingredients-section">
        <h2>Ingredients</h2>
        <table className="ingredients-table">
          <tbody>
            {recipe.ingredients.map((ing, idx) => (
              <tr key={idx}>
                <td className="ingredient-name">{ing.name}</td>
                <td className="ingredient-amount">{ing.amount || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="instructions-section">
        <h2>Instructions</h2>
        <p className="instructions">{recipe.instructions}</p>
      </section>
    </div>
  );
}
