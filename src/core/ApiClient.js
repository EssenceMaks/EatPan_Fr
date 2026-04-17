/**
 * EatPan Frontend v2 — API Client
 * All requests go through Cloudflare Worker → backend
 * Auth tokens managed by Supabase SDK (auto-refresh)
 */

import { supabase } from './supabaseClient.js';

export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const LOCAL_API   = 'http://localhost:6600/api/v1';
const CLOUD_API   = 'https://api.eatpan.com/api/v1';
const RENDER_API  = 'https://eatpan-back.onrender.com/api/v1';

const API_BASE = IS_LOCAL ? LOCAL_API : CLOUD_API;

/** Get fresh auth token from Supabase SDK (auto-refreshed) */
async function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    console.warn('Auth: failed to get session', e.message);
  }
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

  const doFetch = async (base, withAuth = true) => {
    const hdrs = withAuth ? await getAuthHeaders(options.headers || {}) : (options.headers || {});
    return fetch(`${base}${path}`, { cache: 'no-store', ...options, headers: hdrs });
  };

  // Try a single endpoint: with auth → if 401/403 → retry anonymous
  const tryEndpoint = async (base, label) => {
    const authHdrs = await getAuthHeaders();
    const hasToken = !!authHdrs['Authorization'];
    const r = await doFetch(base, true);
    if (r.ok || r.status === 204) {
      console.log(`🟢 API [${base}] ${r.status} ${label}`);
      return r;
    }
    // If 401/403 and we sent a token, retry WITHOUT token (anonymous access)
    if ((r.status === 401 || r.status === 403) && hasToken) {
      console.warn(`🟡 API [${base}] ${r.status} with token — retrying anonymous...`);
      const r2 = await doFetch(base, false);
      if (r2.ok || r2.status === 204) {
        console.log(`🟢 API [${base}] ${r2.status} (anonymous) ${label}`);
        return r2;
      }
      console.warn(`🟡 API [${base}] ${r2.status} anonymous also failed`);
      return r2;
    }
    console.warn(`🟡 API [${base}] ${r.status} ${label} — trying next...`);
    return r;
  };

  // Try cached base first
  if (cachedBase) {
    try {
      const r = await tryEndpoint(cachedBase, '(cached)');
      if (r.ok) {
        if (r.status === 204) return null;
        return await r.json();
      }
      window._activeApiBase = null;
    } catch (e) {
      console.warn(`🔴 API [${cachedBase}] network error — trying next...`);
      window._activeApiBase = null;
    }
  }

  // Failover queue
  let lastReachable = null;
  for (const base of endpoints) {
    if (base === cachedBase) continue;
    try {
      const r = await tryEndpoint(base, '');
      if (r.ok) {
        window._activeApiBase = base;
        localStorage.setItem('eatpan_active_api', base);
        if (r.status === 204) return null;
        return await r.json();
      }
      if (r.status >= 200 && r.status < 500) {
        lastReachable = { base, response: r };
      }
    } catch (e) {
      console.warn(`🔴 API [${base}] failed:`, e.message);
    }
  }

  if (lastReachable) {
    const { base, response: r } = lastReachable;
    window._activeApiBase = base;
    localStorage.setItem('eatpan_active_api', base);
    console.warn(`⚠️ API fallback: ${base} (${r.status})`);
    try { return await r.json(); } catch (e) { return null; }
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
// CATEGORIES
// ============================================================
export const CategoryService = {
  fetchAll: () => apiFetch('/categories/'),
  create: (data) => apiFetch('/categories/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiFetch(`/categories/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  delete: (id) => apiFetch(`/categories/${id}/`, { method: 'DELETE' }),
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
