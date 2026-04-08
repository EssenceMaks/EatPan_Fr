/**
 * EatPan Frontend v2 — API Client
 * All requests go through Cloudflare Worker → backend
 */

export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE = IS_LOCAL
  ? 'http://localhost:6600/api/v1'
  : 'https://api.eatpan.com/api/v1';

function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  try {
    const raw = localStorage.getItem('eatpan_header_auth_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
    }
  } catch (e) {}
  return headers;
}

/** Generic fetch wrapper with error handling */
async function apiFetch(path, options = {}) {
  try {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: getAuthHeaders(options.headers || {}),
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error [${path}]:`, error);
    return null;
  }
}

// ============================================================
// RECIPES
// ============================================================
export const RecipeService = {
  fetchAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    params.append('_t', Date.now());
    return apiFetch(`/recipes/?${params}`);
  },
  fetchDetail: (id) => apiFetch(`/recipes/${id}/?_t=${Date.now()}`),
  create: (data) => apiFetch('/recipes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  }),
  update: (id, data) => apiFetch(`/recipes/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, is_active: true }),
  }),
  delete: (id) => apiFetch(`/recipes/${id}/`, { method: 'DELETE' }),
  toggleLike: (id) => apiFetch(`/recipes/${id}/toggle_like/`, { method: 'POST' }),
};

// ============================================================
// RECIPE BOOKS
// ============================================================
export const BookService = {
  fetchAll: () => apiFetch('/recipe-books/'),
  create: (name, data = {}) => apiFetch('/recipe-books/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  }),
  update: (id, name, data) => apiFetch(`/recipe-books/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...(name && { name }), ...(data && { data }) }),
  }),
};

// ============================================================
// USER PROFILE (planned — for UserProfile endpoints)
// ============================================================
export const ProfileService = {
  getMe: () => apiFetch('/profile/me/'),
  updateMe: (data) => apiFetch('/profile/me/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getStats: () => apiFetch('/profile/me/stats/'),
};

// ============================================================
// TASKS (planned — stored in UserProfile.tasks JSON)
// ============================================================
export const TaskService = {
  fetchAll: () => apiFetch('/tasks/'),
  create: (task) => apiFetch('/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  }),
  update: (uuid, task) => apiFetch(`/tasks/${uuid}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  }),
  delete: (uuid) => apiFetch(`/tasks/${uuid}/`, { method: 'DELETE' }),
};

// ============================================================
// PREFERENCES (planned)
// ============================================================
export const PreferencesService = {
  get: () => apiFetch('/preferences/'),
  save: (prefs) => apiFetch('/preferences/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  }),
};

// ============================================================
// HEALTH CHECK
// ============================================================
export const HealthService = {
  check: () => apiFetch('/../health'),
};

export { API_BASE };
