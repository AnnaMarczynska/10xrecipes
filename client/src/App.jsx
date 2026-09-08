import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { Login } from './components/Login';
import { RecipeSearch } from './components/RecipeSearch';
import { Favorites } from './components/Favorites';
import { RecipeDetailPage } from './components/RecipeDetailPage';
import './index.css';

function App() {
  const { token, email, logout } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('search');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [lastSearchResults, setLastSearchResults] = useState([]);
  const [lastSearchParams, setLastSearchParams] = useState(null);

  // Clear search results on new login
  useEffect(() => {
    setLastSearchResults([]);
    setLastSearchParams(null);
  }, [token]);

  if (!token) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2563eb', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🍽️ 10xRecipes</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>{email}</span>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', gap: '16px' }}>
          <button
            onClick={() => {
              setCurrentPage('search');
              setSelectedRecipe(null);
            }}
            style={{
              padding: '12px 16px',
              fontWeight: '600',
              borderBottom: currentPage === 'search' ? '2px solid #2563eb' : '2px solid transparent',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: currentPage === 'search' ? '#2563eb' : '#666',
              fontSize: '14px',
            }}
          >
            🔍 Search
          </button>
          <button
            onClick={() => {
              setCurrentPage('favorites');
              setSelectedRecipe(null);
            }}
            style={{
              padding: '12px 16px',
              fontWeight: '600',
              borderBottom: currentPage === 'favorites' ? '2px solid #2563eb' : '2px solid transparent',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: currentPage === 'favorites' ? '#2563eb' : '#666',
              fontSize: '14px',
            }}
          >
            ⭐ Favorites
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ padding: currentPage === 'search' && selectedRecipe ? '0' : '24px 16px' }}>
        {selectedRecipe ? (
          <RecipeDetailPage
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            isFavorited={favoriteIds.has(selectedRecipe.id)}
            onFavoriteChange={(recipeId, isFavorited) => {
              if (isFavorited) {
                setFavoriteIds(new Set([...favoriteIds, recipeId]));
              } else {
                setFavoriteIds(new Set([...favoriteIds].filter(id => id !== recipeId)));
              }
            }}
          />
        ) : currentPage === 'search' ? (
          <RecipeSearch
            onRecipeClick={setSelectedRecipe}
            previousResults={lastSearchResults}
            previousParams={lastSearchParams}
            onSearch={(results, params) => {
              setLastSearchResults(results);
              setLastSearchParams(params);
            }}
          />
        ) : (
          <Favorites onRecipeClick={setSelectedRecipe} />
        )}
      </main>
    </div>
  );
}

export default App;
