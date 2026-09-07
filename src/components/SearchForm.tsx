import { useState } from 'react';
import { searchRecipes, RecipeResult } from '../api/recipeClient';
import IngredientAutocomplete from './IngredientAutocomplete';
import TimeRangeSelector from './TimeRangeSelector';
import RecipeResultsList from './RecipeResultsList';
import RecipeDetail from '../pages/RecipeDetailPage';
import './SearchForm.css';

export default function SearchForm() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('30-60');
  const [results, setResults] = useState<RecipeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ingredients.length === 0) {
      setError('Please select at least one ingredient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchRecipes(ingredients, timeRange);
      setResults(data?.results || []);
    } catch (err) {
      console.error('Search caught error:', err);
      setError('Search failed. Try again in a moment.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (selectedRecipeId) {
    return (
      <div className="detail-view-wrapper">
        <button
          className="back-button"
          onClick={() => setSelectedRecipeId(null)}
        >
          ← Back to Results
        </button>
        <RecipeDetail recipeId={selectedRecipeId} />
      </div>
    );
  }

  return (
    <div className="search-form-container">
      <form onSubmit={handleSearch} className="search-form">
        <IngredientAutocomplete onSelectIngredients={setIngredients} />
        <TimeRangeSelector onSelectRange={setTimeRange} />
        <button
          type="submit"
          disabled={ingredients.length === 0}
          className="search-button"
        >
          {loading ? 'Searching...' : 'Search Recipes'}
        </button>
      </form>

      <RecipeResultsList
        results={results}
        loading={loading}
        error={error}
        onSelectRecipe={setSelectedRecipeId}
      />
    </div>
  );
}
