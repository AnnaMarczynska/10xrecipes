import SearchForm from './components/SearchForm';
import './App.css';

export default function App() {
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
