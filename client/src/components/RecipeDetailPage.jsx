export function RecipeDetailPage({ recipe, onBack }) {
  if (!recipe) return null;

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
        {/* Recipe Image */}
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.name}
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
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
          {recipe.name}
        </h1>

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
          {recipe.cookTime && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                COOKING TIME
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                ⏱️ {recipe.cookTime} min
              </p>
            </div>
          )}
          {recipe.matchPercentage && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                INGREDIENT MATCH
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
                {recipe.matchPercentage}%
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
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  style={{
                    padding: '12px 0',
                    color: '#666',
                    borderBottom: index < recipe.ingredients.length - 1 ? '1px solid #eee' : 'none',
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
        {recipe.instructions && (
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
              {recipe.instructions}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
