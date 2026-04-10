/**
 * EatPan Frontend v2 — API Client
 * All requests go through Cloudflare Worker → backend
 */

export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const LOCAL_API   = 'http://localhost:6600/api/v1';
const CLOUD_API   = 'https://api.eatpan.com/api/v1';
const RENDER_API  = 'https://eatpan-back.onrender.com/api/v1';

const API_BASE = IS_LOCAL ? LOCAL_API : CLOUD_API;

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

/** Fetch with failover: Cloudflare tunnel → local Docker → Render */
async function apiFetch(path, options = {}) {
  // ALWAYS try Cloudflare first (it tunnels to local Docker when available)
  // Then direct local Docker, then Render as last resort
  const endpoints = IS_LOCAL
    ? [CLOUD_API, LOCAL_API, RENDER_API]
    : [CLOUD_API, RENDER_API];

  let cachedBase = window._activeApiBase || localStorage.getItem('eatpan_active_api');
  // Ensure cached base is in our endpoint list
  if (cachedBase && !endpoints.includes(cachedBase)) {
    cachedBase = null;
    window._activeApiBase = null;
  }

  const isValid = (r) => {
    if (r.status === 204) return true;
    if (!r.ok && (r.status < 400 || r.status >= 500)) return false;
    const ct = r.headers.get('content-type');
    return ct && ct.includes('application/json');
  };

  const doFetch = (base) => fetch(`${base}${path}`, {
    cache: 'no-store',
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

  // Try cached base first
  if (cachedBase) {
    try {
      const r = await doFetch(cachedBase);
      if (isValid(r)) {
        if (r.status === 204) return null;
        return await r.json();
      }
    } catch (e) {
      console.warn(`Cached API ${cachedBase} failed, falling over...`);
      window._activeApiBase = null;
    }
  }

  // Failover queue
  for (const base of endpoints) {
    if (base === cachedBase) continue;
    try {
      const r = await doFetch(base);
      if (isValid(r)) {
        window._activeApiBase = base;
        localStorage.setItem('eatpan_active_api', base);
        if (r.status === 204) return null;
        return await r.json();
      }
    } catch (e) {
      console.warn(`Failed to reach ${base}:`, e.message);
    }
  }

  console.error(`API Error [${path}]: all endpoints unreachable`);
  return null;
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

/** Check if connected to local media server (for recipe photos) */
export function isLocalMedia() {
  const active = window._activeApiBase || localStorage.getItem('eatpan_active_api') || '';
  return active === LOCAL_API || active === CLOUD_API; // Cloudflare tunnels to local
}

export { API_BASE };
