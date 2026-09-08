import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { recipeAPI, favoriteAPI, ingredientAPI, allergenAPI } from '../services/api';
import { RecipeCard } from './RecipeCard';

const TIME_RANGES = ['<15', '15-30', '30-60', '60+'];

export function RecipeSearch({ onRecipeClick }) {
  const { token } = useContext(AuthContext);
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timeRange, setTimeRange] = useState('30-60');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [userAllergens, setUserAllergens] = useState([]);
  const [commonAllergens, setCommonAllergens] = useState([]);
  const [showAllergens, setShowAllergens] = useState(false);

  // Load common allergens on mount
  useEffect(() => {
    allergenAPI.getCommon().then(res => {
      setCommonAllergens(res.data?.allergens || []);
    }).catch(() => {});

    if (token) {
      allergenAPI.getUserAllergens(token).then(res => {
        setUserAllergens((res.allergens || []).map(a => a.id));
      }).catch(() => {});
    }
  }, [token]);

  // Handle ingredient search with autocomplete
  const handleIngredientChange = async (value) => {
    setCurrentIngredient(value);
    if (value.trim().length >= 2) {
      try {
        const response = await ingredientAPI.search(value);
        setSuggestions(response.data?.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    if (!ingredients.includes(suggestion)) {
      setIngredients([...ingredients, suggestion]);
    }
    setCurrentIngredient('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient)) {
      setIngredients([...ingredients, currentIngredient]);
      setCurrentIngredient('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const removeIngredient = (ing) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleAllergenToggle = async (allergen, isAdded) => {
    try {
      if (isAdded) {
        await allergenAPI.add(allergen, token);
        setUserAllergens([...userAllergens, allergen]);
      } else {
        const allergenId = userAllergens.indexOf(allergen);
        if (allergenId >= 0) {
          await allergenAPI.remove(allergenId, token);
          setUserAllergens(userAllergens.filter((_, i) => i !== allergenId));
        }
      }
    } catch (err) {
      setError(`Failed to update allergen: ${err.message}`);
    }
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
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={currentIngredient}
                onChange={(e) => handleIngredientChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                onFocus={() => currentIngredient.length >= 2 && setShowSuggestions(true)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
                placeholder="e.g., chicken, pasta..."
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                }}>
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      onClick={() => selectSuggestion(s)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={addIngredient}
              style={{
                padding: '10px 16px',
                backgroundColor: '#2563eb',
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
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
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
                    color: '#1e40af',
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

        {/* Allergens */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setShowAllergens(!showAllergens)}
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#2563eb',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showAllergens ? '▼' : '▶'} Allergen Preferences ({userAllergens.length})
          </button>
          {showAllergens && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {commonAllergens.map((allergen) => (
                <label key={allergen} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={userAllergens.includes(allergen)}
                    onChange={(e) => handleAllergenToggle(allergen, e.target.checked)}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>{allergen}</span>
                </label>
              ))}
            </div>
          )}
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
                  backgroundColor: timeRange === range ? '#2563eb' : '#e5e7eb',
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
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            color: '#1e40af',
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
            backgroundColor: '#2563eb',
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
              onCardClick={onRecipeClick}
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
