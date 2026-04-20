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

/** Cached session to avoid Supabase lock contention */
let _sessionCache = { session: null, ts: 0 };
const SESSION_CACHE_TTL = 3000; // 3 sec

/** Get fresh auth token from Supabase SDK (cached to avoid lock spam) */
async function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  try {
    const now = Date.now();
    if (_sessionCache.ts && (now - _sessionCache.ts) < SESSION_CACHE_TTL) {
      // Use cached session
      const session = _sessionCache.session;
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      _sessionCache = { session, ts: now };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
  } catch (e) {
    console.warn('Auth: failed to get session', e.message);
  }
  return headers;
}

/** Check if user is currently authenticated (no network call) */
function isAuthenticated() {
  return !!_sessionCache.session?.access_token;
}

/** Reset session cache — must be called when auth state changes */
export function invalidateSessionCache() {
  _sessionCache = { session: null, ts: 0 };
}

/** Circuit-breaker: stop retrying when all endpoints are confirmed down */
const _circuitBreaker = { failedAt: 0, cooldownMs: 30000, logged: false };

/** Reset circuit-breaker — must be called when auth state changes,
 *  so that new JWT can be tried immediately after login */
export function resetCircuitBreaker() {
  _circuitBreaker.failedAt = 0;
  _circuitBreaker.logged = false;
}

/** Fetch with failover: Cloudflare tunnel → local Docker → Render */
async function apiFetch(path, options = {}) {
  // Circuit-breaker: if all endpoints failed recently, return null immediately
  // BUG-5 fix: логируем только один раз при активации, потом тихо
  if (_circuitBreaker.failedAt && (Date.now() - _circuitBreaker.failedAt < _circuitBreaker.cooldownMs)) {
    if (!_circuitBreaker.logged) {
      const remaining = Math.round((_circuitBreaker.cooldownMs - (Date.now() - _circuitBreaker.failedAt))/1000);
      console.warn(`⏸️ API circuit-breaker active (${remaining}s cooldown). Suppressing further logs.`);
      _circuitBreaker.logged = true;
    }
    return null;
  }
  // Сброс флага логирования при деактивации circuit-breaker
  _circuitBreaker.logged = false;

  // Endpoint priority:
  // LOCAL development: LOCAL_API first (no CORS), then CLOUD_API as fallback
  // Production: CLOUD_API only, Render as fallback
  const endpoints = IS_LOCAL 
      ? [LOCAL_API, CLOUD_API] 
      : [CLOUD_API, RENDER_API];

  let cachedBase = window._activeApiBase || localStorage.getItem('eatpan_active_api');
  let cachedTime = localStorage.getItem('eatpan_active_api_time');

  // Если мы сидим на фоллбэке (Render) дольше 1 минуты, пробуем вернуться на основной CLOUD_API
  if (cachedBase === RENDER_API && cachedTime && (Date.now() - parseInt(cachedTime)) > 60000) {
    console.log('🔄 TTL expired for Render fallback, retrying primary API (Cloudflare)...');
    cachedBase = null;
    window._activeApiBase = null;
    localStorage.removeItem('eatpan_active_api');
    localStorage.removeItem('eatpan_active_api_time');
  }

  if (cachedBase && !endpoints.includes(cachedBase)) {
    cachedBase = null;
    window._activeApiBase = null;
    localStorage.removeItem('eatpan_active_api');
    localStorage.removeItem('eatpan_active_api_time');
  }

  const isFormData = options.body instanceof FormData;
  const rawResponse = options.rawResponse || false;

  const doFetch = async (base, withAuth = true) => {
    const extraHdrs = { ...(options.headers || {}) };
    // For FormData: do NOT set Content-Type, browser adds multipart boundary automatically
    if (isFormData) delete extraHdrs['Content-Type'];
    const hdrs = withAuth ? await getAuthHeaders(extraHdrs) : extraHdrs;
    const fetchOpts = { cache: 'no-store', ...options, headers: hdrs };
    delete fetchOpts.rawResponse; // remove custom option before passing to fetch
    return fetch(`${base}${path}`, fetchOpts);
  };

  // Try a single endpoint
  const tryEndpoint = async (base, label) => {
    const authHdrs = await getAuthHeaders();
    const hasToken = !!authHdrs['Authorization'];
    try {
      const r = await doFetch(base, true);
      if (r.ok || r.status === 204) {
        console.log(`%c● API [${base}] ${r.status} ${label}`, 'color:#4ade80');
        return r;
      }
      // Auth error — return silently, no anonymous retry (prevents CORS spam)
      if (r.status === 401 || r.status === 403) {
        return r;
      }
      console.warn(`▲ API [${base}] ${r.status} ${label}`);
      return r;
    } catch (e) {
      throw e; // Re-throw network errors for cascade to handle
    }
  };

  // Try cached base first
  if (cachedBase) {
    try {
      const r = await tryEndpoint(cachedBase, '(cached)');
      if (r.ok) {
        _circuitBreaker.failedAt = 0;
        if (rawResponse) return r;
        if (r.status === 204) return null;
        return await r.json();
      }
      if (r.status === 401 || r.status === 403) {
        if (rawResponse) return r;
        try { return await r.json(); } catch (e) { return null; }
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
        _circuitBreaker.failedAt = 0;
        window._activeApiBase = base;
        localStorage.setItem('eatpan_active_api', base);
        localStorage.setItem('eatpan_active_api_time', Date.now().toString());
        if (rawResponse) return r;
        if (r.status === 204) return null;
        return await r.json();
      }
      if (r.status === 401 || r.status === 403) {
        window._activeApiBase = base;
        localStorage.setItem('eatpan_active_api', base);
        localStorage.setItem('eatpan_active_api_time', Date.now().toString());
        if (rawResponse) return r;
        try { return await r.json(); } catch (e) { return null; }
      }
      // A1 FIX: НЕ считать 401/403 как lastReachable — это auth-ошибка, не рабочий ответ
      if (r.status >= 200 && r.status < 500 && r.status !== 401 && r.status !== 403) {
        lastReachable = { base, response: r };
      }
    } catch (e) {
      // Network errors — only warn once, not on every endpoint
      if (IS_LOCAL && base === CLOUD_API) {
        // Expected: Cloudflare tunnel may be down during local dev
      } else {
        console.warn(`API [${base}] unreachable`);
      }
    }
  }

  if (lastReachable) {
    const { base, response: r } = lastReachable;
    window._activeApiBase = base;
    localStorage.setItem('eatpan_active_api', base);
    localStorage.setItem('eatpan_active_api_time', Date.now().toString());
    try { return await r.json(); } catch (e) { return null; }
  }

  // Only activate circuit-breaker for authenticated users — guest 403 is expected
  if (isAuthenticated()) {
    console.error(`API [${path}]: all endpoints unreachable`);
    _circuitBreaker.failedAt = Date.now();
  }
  return null;
}

// ============================================================
// RECIPES
// ============================================================
export const RecipeService = {
  fetchAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    params.append('_t', Date.now());
    const res = await apiFetch(`/recipes/?${params}`);
    return res?.results ? res.results : res;
  },
  fetchPage: (filters = {}) => {
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
  fetchAll: async () => {
    const res = await apiFetch('/recipe-books/');
    return res?.results ? res.results : res;
  },
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
  fetchAll: async () => {
    const res = await apiFetch('/categories/');
    return res?.results ? res.results : res;
  },
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
// USER PROFILE — Phase 3
// ============================================================
export const ProfileService = {
  getMe: () => apiFetch('/profile/me/'),
  updateMe: (data) => apiFetch('/profile/me/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getPublic: (uuid) => apiFetch(`/profile/${uuid}/public/`),
};

// ============================================================
// ACCOUNT — Phase 3
// ============================================================
export const AccountService = {
  updateTier: (tier) => apiFetch('/account/tier/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  }),
  createReferral: () => apiFetch('/account/referral/create/', { method: 'POST' }),
  activateReferral: (code) => apiFetch('/account/referral/activate/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }),
};

// ============================================================
// TASKS — Phase 4
// ============================================================
export const TaskService = {
  fetchAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    const queryStr = qs.toString();
    return apiFetch(`/tasks/${queryStr ? '?' + queryStr : ''}`);
  },
  create: (task) => apiFetch('/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  }),
  get: (uuid) => apiFetch(`/tasks/${uuid}/`),
  update: (uuid, data) => apiFetch(`/tasks/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  delete: (uuid) => apiFetch(`/tasks/${uuid}/`, { method: 'DELETE' }),
  // Comments
  addComment: (taskUuid, text) => apiFetch(`/tasks/${taskUuid}/comments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }),
  editComment: (taskUuid, cid, text) => apiFetch(`/tasks/${taskUuid}/comments/${cid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }),
  deleteComment: (taskUuid, cid) => apiFetch(`/tasks/${taskUuid}/comments/${cid}/`, { method: 'DELETE' }),
  // Groups
  fetchGroups: () => apiFetch('/task-groups/'),
  createGroup: (data) => apiFetch('/task-groups/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateGroup: (uuid, data) => apiFetch(`/task-groups/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteGroup: (uuid) => apiFetch(`/task-groups/${uuid}/`, { method: 'DELETE' }),
  shareGroup: (uuid, userUuid) => apiFetch(`/task-groups/${uuid}/share/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_uuid: userUuid }),
  }),
};

// ============================================================
// TASK TYPES — Phase 14
// ============================================================
export const TaskTypeService = {
  fetchAll: () => apiFetch('/task-types/'),
  create: (data) => apiFetch('/task-types/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  update: (uuid, data) => apiFetch(`/task-types/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  delete: (uuid) => apiFetch(`/task-types/${uuid}/`, { method: 'DELETE' }),
  createSubtype: (typeUuid, data) => apiFetch(`/task-types/${typeUuid}/subtypes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateSubtype: (subtypeUuid, data) => apiFetch(`/task-subtypes/${subtypeUuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteSubtype: (subtypeUuid) => apiFetch(`/task-subtypes/${subtypeUuid}/`, { method: 'DELETE' }),
};

// ============================================================
// MEAL PLAN — Phase 5
// ============================================================
export const MealPlanService = {
  fetchAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    return apiFetch(`/meal-plan/?${qs}`);
  },
  create: (data) => apiFetch('/meal-plan/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  get: (uuid) => apiFetch(`/meal-plan/${uuid}/`),
  update: (uuid, data) => apiFetch(`/meal-plan/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  delete: (uuid) => apiFetch(`/meal-plan/${uuid}/`, { method: 'DELETE' }),
  bindRecipe: (entryUuid, recipeUuid) => apiFetch(`/meal-plan/${entryUuid}/bind-recipe/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_uuid: recipeUuid }),
  }),
  unbindRecipe: (entryUuid, recipeUuid) => apiFetch(`/meal-plan/${entryUuid}/unbind-recipe/${recipeUuid}/`, {
    method: 'DELETE',
  }),
  // Labels
  fetchLabels: () => apiFetch('/meal-plan/labels/'),
  createLabel: (data) => apiFetch('/meal-plan/labels/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateLabel: (uuid, data) => apiFetch(`/meal-plan/labels/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteLabel: (uuid) => apiFetch(`/meal-plan/labels/${uuid}/`, { method: 'DELETE' }),
};

// ============================================================
// PANTRY — Phase 6
// ============================================================
export const PantryService = {
  fetchAll: () => apiFetch('/pantry/'),
  addItem: (data) => apiFetch('/pantry/items/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateItem: (uuid, data) => apiFetch(`/pantry/items/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteItem: (uuid) => apiFetch(`/pantry/items/${uuid}/`, { method: 'DELETE' }),
  fetchLocations: () => apiFetch('/pantry/locations/'),
  addLocation: (data) => apiFetch('/pantry/locations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateLocation: (uuid, data) => apiFetch(`/pantry/locations/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteLocation: (uuid) => apiFetch(`/pantry/locations/${uuid}/`, { method: 'DELETE' }),
  expirationReport: () => apiFetch('/pantry/expiration-report/'),
};

// ============================================================
// SHOPPING — Phase 7
// ============================================================
export const ShoppingService = {
  fetchAll: () => apiFetch('/shopping/'),
  createList: (data) => apiFetch('/shopping/lists/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateList: (uuid, data) => apiFetch(`/shopping/lists/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteList: (uuid) => apiFetch(`/shopping/lists/${uuid}/`, { method: 'DELETE' }),
  shareList: (uuid, userUuid) => apiFetch(`/shopping/lists/${uuid}/share/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_uuid: userUuid }),
  }),
  addItem: (listUuid, data) => apiFetch(`/shopping/lists/${listUuid}/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateItem: (listUuid, itemUuid, data) => apiFetch(`/shopping/lists/${listUuid}/items/${itemUuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteItem: (listUuid, itemUuid) => apiFetch(`/shopping/lists/${listUuid}/items/${itemUuid}/`, {
    method: 'DELETE',
  }),
};

// ============================================================
// SOCIAL — Phase 8
// ============================================================
export const SocialService = {
  follow: (uuid) => apiFetch(`/social/follow/${uuid}/`, { method: 'POST' }),
  unfollow: (uuid) => apiFetch(`/social/follow/${uuid}/`, { method: 'DELETE' }),
  addFriend: (uuid, nickname = '') => apiFetch(`/social/friends/${uuid}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  }),
  updateFriend: (uuid, data) => apiFetch(`/social/friends/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  removeFriend: (uuid) => apiFetch(`/social/friends/${uuid}/`, { method: 'DELETE' }),
  fetchGroups: () => apiFetch('/social/friend-groups/'),
  createGroup: (data) => apiFetch('/social/friend-groups/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateGroup: (uuid, data) => apiFetch(`/social/friend-groups/${uuid}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteGroup: (uuid) => apiFetch(`/social/friend-groups/${uuid}/`, { method: 'DELETE' }),
  fetchFollowers: () => apiFetch('/social/followers/'),
  fetchFollowing: () => apiFetch('/social/following/'),
  fetchAllUsers: () => apiFetch('/social/all-users/'),
};

// ============================================================
// MESSAGES — Phase 9
// ============================================================
export const MessageService = {
  fetchConversations: () => apiFetch('/messages/'),
  getConversation: (convId) => apiFetch(`/messages/${convId}/`),
  sendDM: (userUuid, text, mediaUuid = '') => apiFetch(`/messages/${userUuid}/send/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, media_uuid: mediaUuid }),
  }),
  editMessage: (convId, msgId, text) => apiFetch(`/messages/${convId}/${msgId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }),
  deleteMessage: (convId, msgId) => apiFetch(`/messages/${convId}/${msgId}/`, { method: 'DELETE' }),
  createGroup: (data) => apiFetch('/messages/groups/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  editGroup: (groupId, data) => apiFetch(`/messages/groups/${groupId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  sendToGroup: (groupId, text, mediaUuid = '') => apiFetch(`/messages/groups/${groupId}/send/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, media_uuid: mediaUuid }),
  }),
};

// ============================================================
// PROMO CODES — Phase 10
// ============================================================
export const PromoService = {
  fetchAll: () => apiFetch('/promo-codes/'),
  get: (code) => apiFetch(`/promo-codes/${code}/`),
  create: (data) => apiFetch('/promo-codes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  update: (code, data) => apiFetch(`/promo-codes/${code}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deactivate: (code) => apiFetch(`/promo-codes/${code}/`, { method: 'DELETE' }),
  use: (code) => apiFetch(`/promo-codes/${code}/use/`, { method: 'POST' }),
  gift: (code, userUuid) => apiFetch(`/promo-codes/${code}/gift/${userUuid}/`, { method: 'POST' }),
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

export { API_BASE, apiFetch };
