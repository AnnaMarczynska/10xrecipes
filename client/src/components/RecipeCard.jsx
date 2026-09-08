export function RecipeCard({ recipe, isFavorite, onAddFavorite }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      cursor: 'pointer',
    }}>
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.name}
          style={{ width: '100%', height: '192px', objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
          {recipe.name}
        </h3>

        {recipe.matchPercentage && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#666' }}>Ingredient Match</span>
              <span style={{ fontWeight: '600', color: '#ea580c' }}>{recipe.matchPercentage}%</span>
            </div>
            <div style={{
              width: '100%',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              height: '6px',
              overflow: 'hidden',
            }}>
              <div
                style={{
                  backgroundColor: '#ea580c',
                  height: '100%',
                  borderRadius: '4px',
                  width: `${recipe.matchPercentage}%`,
                }}
              />
            </div>
          </div>
        )}

        {recipe.cookTime && (
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
            ⏱️ {recipe.cookTime} minutes
          </p>
        )}

        <button
          onClick={onAddFavorite}
          disabled={isFavorite}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            fontWeight: '600',
            border: 'none',
            cursor: isFavorite ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            backgroundColor: isFavorite ? '#e5e7eb' : '#ea580c',
            color: isFavorite ? '#999' : 'white',
            fontSize: '13px',
          }}
        >
          {isFavorite ? '★ Favorited' : '☆ Add to Favorites'}
        </button>
      </div>
    </div>
  );
}
