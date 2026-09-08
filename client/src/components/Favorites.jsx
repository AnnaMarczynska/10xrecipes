import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { favoriteAPI } from '../services/api';

export function Favorites() {
  const { token } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => {
    loadFavorites();
  }, [token]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoriteAPI.getAll(token);
      setFavorites(response.data?.favorites || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotes = (fav) => {
    setEditingId(fav.id);
    setEditingNotes(fav.notes || '');
  };

  const handleSaveNotes = async (fav) => {
    try {
      await favoriteAPI.updateNotes(fav.id, editingNotes, token);
      setFavorites(favorites.map(f =>
        f.id === fav.id ? { ...f, notes: editingNotes } : f
      ));
      setEditingId(null);
      setEditingNotes('');
    } catch (err) {
      setError(`Failed to save notes: ${err.message}`);
    }
  };

  const handleRemove = async (fav) => {
    if (!window.confirm(`Remove "${fav.recipeName}" from favorites?`)) return;

    try {
      await favoriteAPI.remove(fav.id, token);
      setFavorites(favorites.filter(f => f.id !== fav.id));
    } catch (err) {
      setError(`Failed to remove favorite: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', textAlign: 'center', color: '#999' }}>
        Loading favorites...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '24px' }}>
        My Favorites ({favorites.length})
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          color: '#1e40af',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
          No favorites yet. Find some recipes!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {favorites.map((fav) => (
            <div
              key={fav.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  {fav.recipeName}
                </h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                    Notes
                  </label>
                  {editingId === fav.id ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          minHeight: '60px',
                        }}
                        placeholder="Add notes..."
                      />
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                        <button
                          onClick={() => handleSaveNotes(fav)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#e5e7eb',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEditNotes(fav)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        minHeight: '40px',
                        fontSize: '13px',
                        color: fav.notes ? '#333' : '#999',
                        cursor: 'pointer',
                        fontStyle: fav.notes ? 'normal' : 'italic',
                      }}
                    >
                      {fav.notes || 'Click to add notes...'}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Added: {new Date(fav.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleRemove(fav)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
