import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/header.css';

export default function Header() {
  const { isLoggedIn, loading, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return <header className="app-header-bar" />;
  }

  return (
    <header className="app-header-bar">
      <nav className="header-nav">
        <div className="header-brand">
          <Link to="/">Recipe Search</Link>
        </div>
        <div className="header-actions">
          {isLoggedIn && user ? (
            <>
              <Link to="/favorites" className="nav-link">
                ❤️ My Favorites
              </Link>
              <span className="user-email">{user.email}</span>
              <button
                onClick={handleLogout}
                className="logout-button"
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Log In
              </Link>
              <Link to="/signup" className="nav-link signup-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
