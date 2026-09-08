import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { Login } from './components/Login';
import { RecipeSearch } from './components/RecipeSearch';
import './index.css';

function App() {
  const { token, email, logout } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('search');

  if (!token) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🍽️ 10xRecipes</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-orange-700 hover:bg-orange-800 rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 flex gap-4">
          <button
            onClick={() => setCurrentPage('search')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              currentPage === 'search'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🔍 Search
          </button>
          <button
            onClick={() => setCurrentPage('favorites')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              currentPage === 'favorites'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⭐ Favorites
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="py-6">
        {currentPage === 'search' && <RecipeSearch />}
        {currentPage === 'favorites' && (
          <div className="max-w-6xl mx-auto p-4 text-center text-gray-500">
            Favorites feature coming soon...
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
