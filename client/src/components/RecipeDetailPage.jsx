import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { recipeAPI, favoriteAPI } from '../services/api';

export function RecipeDetailPage({ recipe, onBack }) {
  const { token } = useContext(AuthContext);
  const [fullRecipe, setFullRecipe] = useState(recipe);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);

  if (!recipe) return null;

  // Fetch full recipe details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await recipeAPI.getDetails(recipe.id, token);
        // API returns recipe data directly in response.data
        const recipeData = response.data || recipe;
        console.log('Fetched recipe data:', recipeData);
        setFullRecipe(recipeData);
      } catch (err) {
        console.error('Failed to fetch recipe details:', err);
        setFullRecipe(recipe);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [recipe.id, token]);

  const handleAddFavorite = async () => {
    try {
      await favoriteAPI.add(recipe.id, recipe.name, token);
      setIsFavorite(true);
    } catch (err) {
      setError(`Failed to add favorite: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Recipe Details</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            color: '#1e40af',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Recipe Image */}
        {fullRecipe.image && (
          <img
            src={fullRecipe.image}
            alt={fullRecipe.name}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          />
        )}

        {/* Recipe Name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', gap: '16px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: 0 }}>
            {fullRecipe.name}
          </h1>
          <button
            onClick={handleAddFavorite}
            disabled={isFavorite}
            style={{
              padding: '12px 20px',
              backgroundColor: isFavorite ? '#e5e7eb' : '#2563eb',
              color: isFavorite ? '#999' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: isFavorite ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isFavorite ? '★ Favorited' : '☆ Add to Favorites'}
          </button>
        </div>

        {/* Quick Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {fullRecipe.cookTime && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                COOKING TIME
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                ⏱️ {fullRecipe.cookTime} min
              </p>
            </div>
          )}
          {fullRecipe.matchPercentage && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                INGREDIENT MATCH
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
                {fullRecipe.matchPercentage}%
              </p>
            </div>
          )}
        </div>

        {/* Ingredients */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #2563eb',
          }}>
            Ingredients
          </h2>
          <ul style={{
            listStyle: 'none',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            {fullRecipe.ingredients && fullRecipe.ingredients.length > 0 ? (
              fullRecipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  style={{
                    padding: '12px 0',
                    color: '#666',
                    borderBottom: index < fullRecipe.ingredients.length - 1 ? '1px solid #eee' : 'none',
                    fontSize: '15px',
                  }}
                >
                  ✓ {ingredient}
                </li>
              ))
            ) : (
              <li style={{ padding: '12px 0', color: '#999' }}>No ingredients listed</li>
            )}
          </ul>
        </section>

        {/* Instructions */}
        {fullRecipe.instructions && (
          <section>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #2563eb',
            }}>
              Instructions
            </h2>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              lineHeight: '1.8',
              color: '#555',
              whiteSpace: 'pre-wrap',
              fontSize: '15px',
            }}>
              {fullRecipe.instructions}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
