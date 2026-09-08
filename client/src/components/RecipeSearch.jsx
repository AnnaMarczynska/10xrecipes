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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      {/* Search Panel */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>Find Recipes</h2>

        {/* Ingredients */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>Ingredients</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
              placeholder="e.g., chicken, pasta..."
            />
            <button
              onClick={addIngredient}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ea580c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ingredients.map((ing) => (
              <div
                key={ing}
                style={{
                  backgroundColor: '#fed7aa',
                  color: '#9a3412',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9a3412',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '18px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>Cooking Time</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: timeRange === range ? '#ea580c' : '#e5e7eb',
                  color: timeRange === range ? 'white' : '#333',
                  fontSize: '13px',
                }}
              >
                {range === '<15' ? '<15min' : range === '60+' ? '60+min' : range + 'min'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ea580c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            fontSize: '14px',
          }}
        >
          {loading ? 'Searching...' : 'Search Recipes'}
        </button>
      </div>

      {/* Results */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
          Results ({results.length})
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
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
          <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
            No recipes found. Try different ingredients or cooking time.
          </div>
        )}
      </div>
    </div>
  );
}
