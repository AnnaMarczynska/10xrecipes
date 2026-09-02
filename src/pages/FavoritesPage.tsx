import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>My Favorites</h1>
        <p>Your saved recipes</p>
      </header>
      <main className="app-main">
        <p>Your favorite recipes will appear here.</p>
        <Link to="/">Back to search</Link>
      </main>
    </div>
  );
}
