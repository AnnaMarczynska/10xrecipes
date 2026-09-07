import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/scaffold/ProtectedRoute';
import SearchForm from './components/recipe-search/SearchForm';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import FavoritesPage from './pages/FavoritesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import Header from './components/scaffold/Header';
import './App.css';

function HomePage() {
  const navigate = useNavigate();

  const handleSelectRecipe = (recipeId: string) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍳 Recipe Search</h1>
        <p>Find recipes with ingredients you have</p>
      </header>
      <main className="app-main">
        <SearchForm onSelectRecipe={handleSelectRecipe} />
      </main>
      <footer className="app-footer">
        <p>Recipes powered by TheMealDB</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
