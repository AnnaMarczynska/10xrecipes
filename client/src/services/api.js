const API_BASE = 'http://localhost:9090/api';

const getAuthHeader = (token) => {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const authAPI = {
  register: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },
};

export const recipeAPI = {
  search: async (ingredients, timeRange, token) => {
    const response = await fetch(`${API_BASE}/recipes/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      body: JSON.stringify({ ingredients, timeRange }),
    });
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  getDetails: async (recipeId, token) => {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}/details`, {
      headers: getAuthHeader(token),
    });
    if (!response.ok) throw new Error('Failed to fetch recipe details');
    return response.json();
  },
};

export const favoriteAPI = {
  add: async (recipeId, recipeName, token) => {
    const response = await fetch(`${API_BASE}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      body: JSON.stringify({ recipeId, recipeName }),
    });
    if (!response.ok) throw new Error('Failed to add favorite');
    return response.json();
  },

  getAll: async (token) => {
    const response = await fetch(`${API_BASE}/favorites`, {
      headers: getAuthHeader(token),
    });
    if (!response.ok) throw new Error('Failed to fetch favorites');
    return response.json();
  },

  updateNotes: async (favoriteId, notes, token) => {
    const response = await fetch(`${API_BASE}/favorites/${favoriteId}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error('Failed to update notes');
    return response.json();
  },

  remove: async (favoriteId, token) => {
    const response = await fetch(`${API_BASE}/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: getAuthHeader(token),
    });
    if (!response.ok) throw new Error('Failed to remove favorite');
    return response.json();
  },
};

export const ingredientAPI = {
  search: async (query) => {
    const response = await fetch(`${API_BASE}/ingredients/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search ingredients');
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE}/ingredients`);
    if (!response.ok) throw new Error('Failed to fetch ingredients');
    return response.json();
  },
};

export const allergenAPI = {
  getCommon: async () => {
    const response = await fetch(`${API_BASE}/allergens/common`);
    if (!response.ok) throw new Error('Failed to fetch allergens');
    return response.json();
  },

  getUserAllergens: async (token) => {
    const response = await fetch(`${API_BASE}/allergens`, {
      headers: getAuthHeader(token),
    });
    if (!response.ok) throw new Error('Failed to fetch user allergens');
    return response.json();
  },

  add: async (allergen, token) => {
    const response = await fetch(`${API_BASE}/allergens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      body: JSON.stringify({ allergen }),
    });
    if (!response.ok) throw new Error('Failed to add allergen');
    return response.json();
  },

  remove: async (allergenId, token) => {
    const response = await fetch(`${API_BASE}/allergens/${allergenId}`, {
      method: 'DELETE',
      headers: getAuthHeader(token),
    });
    if (!response.ok) throw new Error('Failed to remove allergen');
    return response.json();
  },
};
