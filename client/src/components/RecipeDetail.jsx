export function RecipeDetail({ recipe, onClose }) {
  if (!recipe) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          ✕
        </button>

        {/* Recipe image */}
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.name}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          />
        )}

        {/* Recipe name */}
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
          {recipe.name}
        </h1>

        {/* Recipe info */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {recipe.cookTime && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Cooking Time</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                ⏱️ {recipe.cookTime} min
              </p>
            </div>
          )}
          {recipe.matchPercentage && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Ingredient Match</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                {recipe.matchPercentage}%
              </p>
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            Ingredients
          </h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
              <li
                key={index}
                style={{
                  padding: '8px 0',
                  color: '#666',
                  borderBottom: '1px solid #eee',
                }}
              >
                • {ingredient}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
              Instructions
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {recipe.instructions}
            </p>
          </div>
        )}

        {/* Close button at bottom */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
