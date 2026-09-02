import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SearchForm from './components/SearchForm';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import FavoritesPage from './pages/FavoritesPage';
import Header from './components/Header';
import './App.css';

function HomePage() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🍳 Recipe Search</h1>
        <p>Find recipes with ingredients you have</p>
      </header>
      <main className="app-main">
        <SearchForm />
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
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
