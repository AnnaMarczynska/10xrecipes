import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { recipeAPI, favoriteAPI } from '../services/api';
import { RecipeCard } from './RecipeCard';

const TIME_RANGES = ['<15', '15-30', '30-60', '60+'];

export function RecipeSearch() {
  const { token } = useContext(AuthContext);
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [timeRange, setTimeRange] = useState('30-60');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient)) {
      setIngredients([...ingredients, currentIngredient]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (ing) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleSearch = async () => {
    if (ingredients.length === 0) {
      setError('Add at least one ingredient');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await recipeAPI.search(ingredients, timeRange, token);
      setResults(response.data?.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (recipe) => {
    try {
      await favoriteAPI.add(recipe.id, recipe.name, token);
      setFavorites(new Set([...favorites, recipe.id]));
    } catch (err) {
      setError(`Failed to add favorite: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Search Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Find Recipes</h2>

        {/* Ingredients */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., chicken, pasta..."
            />
            <button
              onClick={addIngredient}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing) => (
              <div
                key={ing}
                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  className="hover:text-orange-900 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cooking Time</label>
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeRange === range
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {range === '<15' ? '<15min' : range === '60+' ? '60+min' : range + 'min'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Recipes'}
        </button>
      </div>

      {/* Results */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Results ({results.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={favorites.has(recipe.id)}
              onAddFavorite={() => handleAddFavorite(recipe)}
            />
          ))}
        </div>
        {results.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            No recipes found. Try different ingredients or cooking time.
          </div>
        )}
      </div>
    </div>
  );
}
