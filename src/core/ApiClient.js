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
  // On localhost: CORS blocks api.eatpan.com (allows only https://eatpan.com)
  // So we go: local Docker → Render (requires auth token)
  // On production (eatpan.com): Cloudflare → Render
  const endpoints = IS_LOCAL
    ? [LOCAL_API, RENDER_API]
    : [CLOUD_API, RENDER_API];

  let cachedBase = window._activeApiBase || localStorage.getItem('eatpan_active_api');
  if (cachedBase && !endpoints.includes(cachedBase)) {
    cachedBase = null;
    window._activeApiBase = null;
    localStorage.removeItem('eatpan_active_api');
  }

  const doFetch = (base) => fetch(`${base}${path}`, {
    cache: 'no-store',
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

  // Helper: is this a successful usable response?
  const isSuccess = (r) => {
    if (r.status === 204) return true;
    if (r.ok) return true;  // 200-299
    return false;
  };

  // Helper: is the server reachable (even if auth fails)?
  const isReachable = (r) => {
    return r.status >= 200 && r.status < 500; // Not a server error
  };

  // Try cached base first
  if (cachedBase) {
    try {
      const r = await doFetch(cachedBase);
      if (isSuccess(r)) {
        console.log(`🟢 API [${cachedBase}] ${r.status} (cached)`);
        if (r.status === 204) return null;
        return await r.json();
      }
      console.warn(`🟡 API [${cachedBase}] ${r.status} — trying next...`);
      window._activeApiBase = null;
    } catch (e) {
      console.warn(`🔴 API [${cachedBase}] network error — trying next...`);
      window._activeApiBase = null;
    }
  }

  // Failover queue — try each endpoint
  let lastResponse = null;
  for (const base of endpoints) {
    if (base === cachedBase) continue;
    try {
      const r = await doFetch(base);
      console.log(`🔄 API [${base}] → ${r.status}`);

      if (isSuccess(r)) {
        window._activeApiBase = base;
        localStorage.setItem('eatpan_active_api', base);
        if (r.status === 204) return null;
        return await r.json();
      }

      // Server is reachable but returned an error (401/403/404)
      // Keep as last resort but continue trying others
      if (isReachable(r)) {
        lastResponse = { base, response: r };
      }
    } catch (e) {
      console.warn(`🔴 API [${base}] failed:`, e.message);
    }
  }

  // If all endpoints failed with auth errors, use the last reachable response
  // (so we at least get the error JSON for the UI to handle)
  if (lastResponse) {
    const { base, response: r } = lastResponse;
    window._activeApiBase = base;
    localStorage.setItem('eatpan_active_api', base);
    console.warn(`⚠️ API: using ${base} (status ${r.status}) — auth may be required`);
    try {
      return await r.json();
    } catch (e) {
      return null;
    }
  }

  console.error(`❌ API [${path}]: all endpoints unreachable`);
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
