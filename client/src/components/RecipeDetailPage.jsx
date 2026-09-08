import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { recipeAPI, favoriteAPI } from '../services/api';

export function RecipeDetailPage({ recipe, onBack, isFavorited, onFavoriteChange }) {
  const { token } = useContext(AuthContext);
  const [fullRecipe, setFullRecipe] = useState(recipe);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(isFavorited || false);
  const [error, setError] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No recipe selected</p>
      </div>
    );
  }

  // Fetch full recipe details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        console.log('Fetching recipe details for ID:', recipe.id);
        setLoading(true);
        const response = await recipeAPI.getDetails(recipe.id, token);
        console.log('Full recipe response:', response);

        if (response && response.data) {
          console.log('Ingredients in response:', response.data.ingredients);
          console.log('Instructions in response:', response.data.instructions);
          setFullRecipe(response.data);
        } else {
          console.warn('No data in response, using original recipe');
          setFullRecipe(recipe);
        }
      } catch (err) {
        console.error('Failed to fetch recipe details:', err);
        setError(`Error loading recipe: ${err.message}`);
        setFullRecipe(recipe);
      } finally {
        setLoading(false);
      }
    };

    if (recipe && recipe.id) {
      fetchDetails();
    } else {
      console.warn('Recipe or recipe.id missing:', recipe);
      setLoading(false);
    }
  }, [recipe.id, token]);

  // Fetch favorite ID if this recipe is favorited
  useEffect(() => {
    const fetchFavoriteId = async () => {
      if (isFavorited && recipe.id) {
        try {
          const response = await favoriteAPI.getAll(token);
          const fav = response.data?.favorites?.find(f => f.recipeId === recipe.id);
          if (fav) {
            setFavoriteId(fav.id);
            console.log('Found favorite ID:', fav.id);
          }
        } catch (err) {
          console.error('Failed to fetch favorite ID:', err);
        }
      }
    };

    fetchFavoriteId();
  }, [isFavorited, recipe.id, token]);

  const handleFavoriteClick = async () => {
    try {
      if (isFavorite) {
        // Remove from favorites
        if (!favoriteId) {
          setError('Cannot remove: favorite ID not found');
          return;
        }
        console.log('Removing favorite with ID:', favoriteId);
        await favoriteAPI.remove(favoriteId, token);
        setIsFavorite(false);
        setFavoriteId(null);
        onFavoriteChange?.(recipe.id, false);
      } else {
        // Add to favorites
        console.log('Adding to favorites:', recipe.id, recipe.name);
        await favoriteAPI.add(recipe.id, recipe.name, token);
        setIsFavorite(true);
        onFavoriteChange?.(recipe.id, true);
      }
    } catch (err) {
      console.error('Favorite error:', err);
      setError(`Failed to update favorite: ${err.message}`);
    }
  };

  // Use fullRecipe if available, fallback to recipe prop
  const displayRecipe = fullRecipe || recipe;

  if (!displayRecipe) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>No recipe data available</p>
          <button onClick={onBack} style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

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

        {/* Loading indicator */}
        {loading && (
          <div style={{ padding: '12px 16px', backgroundColor: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            ⏳ Loading full recipe details...
          </div>
        )}

        {/* Recipe Image */}
        {displayRecipe.image && (
          <img
            src={displayRecipe.image}
            alt={displayRecipe.name}
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
            {displayRecipe.name}
          </h1>
          <button
            onClick={handleFavoriteClick}
            style={{
              padding: '12px 20px',
              backgroundColor: isFavorite ? '#fee2e2' : '#2563eb',
              color: isFavorite ? '#991b1b' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
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
          {displayRecipe.cookTime && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                COOKING TIME
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                ⏱️ {displayRecipe.cookTime} min
              </p>
            </div>
          )}
          {displayRecipe.matchPercentage && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                INGREDIENT MATCH
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
                {displayRecipe.matchPercentage}%
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
            {displayRecipe.ingredients && displayRecipe.ingredients.length > 0 ? (
              displayRecipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  style={{
                    padding: '12px 0',
                    color: '#666',
                    borderBottom: index < displayRecipe.ingredients.length - 1 ? '1px solid #eee' : 'none',
                    fontSize: '15px',
                  }}
                >
                  ✓ {ingredient.name || ingredient}
                </li>
              ))
            ) : (
              <li style={{ padding: '12px 0', color: '#999' }}>No ingredients listed</li>
            )}
          </ul>
        </section>

        {/* Instructions */}
        {displayRecipe.instructions && (
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
              {displayRecipe.instructions}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
