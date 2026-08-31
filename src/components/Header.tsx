import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

export default function Header() {
  const { isLoggedIn, loading, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <header className="app-header-bar" />;
  }

  return (
    <header className="app-header-bar">
      <nav className="header-nav">
        <div className="header-brand">
          <a href="/">Recipe Search</a>
        </div>
        <div className="header-actions">
          {isLoggedIn && user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="nav-link">
                Log In
              </a>
              <a href="/signup" className="nav-link signup-link">
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
