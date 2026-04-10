// --- ENVIRONMENT TOGGLE ---
export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const LOCAL_API = 'http://localhost:6600/api/v1';
const CLOUD_API = 'https://api.eatpan.com/api/v1'; // Cloudflare Worker балансувальник
const RENDER_API = 'https://eatpan-back.onrender.com/api/v1'; // Хмарний фолбек

function getAuthHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    try {
        const raw = window.localStorage.getItem('eatpan_header_auth_user');
        if (raw) {
            const user = JSON.parse(raw);
            if (user && user.access_token) {
                headers['Authorization'] = `Bearer ${user.access_token}`;
            }
        }
    } catch (e) { }
    return headers;
}

// Розумна функція fetch з Failover-стратегією
async function fetchWithFailover(endpoint, options = {}) {
    // В пріоритеті локальний докер. Якщо потрібно примусово, використовуємо local storage
    const forceLocal = window.localStorage.getItem('eatpan_force_local_api') === 'true';
    
    // Формуємо чергу маршрутизації
    let endpointsToTry = [];
    
    if (IS_LOCAL) {
        // Якщо працюємо на localhost:6800, пропускаємо CLOUD_API через блокування CORS.
        // Пріоритет: свій локальний докер (швидкий відбій якщо лежить), потім одразу Render
        endpointsToTry = forceLocal
            ? [LOCAL_API]
            : [LOCAL_API, RENDER_API];
    } else {
        // На продакшені (itpan.com) йдемо через Cloudflare тунель (який сам балансує на локальні машини),
        // а якщо Cloudflare повертає помилку, йдемо на Render.
        endpointsToTry = [CLOUD_API, RENDER_API];
    }

    let cachedBase = window._activeApiBase || window.localStorage.getItem('eatpan_active_api');
    
    if (cachedBase && !endpointsToTry.includes(cachedBase)) {
        cachedBase = null;
        window._activeApiBase = null;
    }

    const isValidResponse = (resp) => {
        if (!resp.ok && (resp.status < 400 || resp.status >= 500)) return false;
        // Відповідь валідна, якщо це 204 No Content або містить JSON
        if (resp.status === 204) return true;
        const ct = resp.headers.get('content-type');
        return ct && ct.includes('application/json');
    };
    
    if (cachedBase) {
        try {
            const response = await fetch(`${cachedBase}${endpoint}`, options);
            if (isValidResponse(response)) return response;
        } catch (e) {
            console.warn(`Cached API ${cachedBase} failed. Proceeding to failover queue...`);
            window._activeApiBase = null;
        }
    }

    let lastError = null;
    for (const base of endpointsToTry) {
        if (base === cachedBase) continue;
        try {
            const response = await fetch(`${base}${endpoint}`, options);
            if (isValidResponse(response)) {
                window._activeApiBase = base;
                window.localStorage.setItem('eatpan_active_api', base);
                return response;
            }
            console.warn(`${base} returned ${response.status} or invalid non-JSON content. Falling over...`);
        } catch (error) {
            lastError = error;
            console.warn(`Failed to connect to ${base}:`, error);
        }
    }
    
    throw lastError || new Error('Усі сервери недоступні або повертають помилку.');
}

export const RecipeService = {
    // --- RECIPES ---
    async fetchAll(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            params.append('_t', new Date().getTime()); // Вбиваємо кеш браузера
            const response = await fetchWithFailover(`/recipes/?${params.toString()}`, {
                cache: 'no-store',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('API Error fetchAll:', error);
            return [];
        }
    },

    async fetchDetail(id) {
        try {
            const response = await fetchWithFailover(`/recipes/${id}/?_t=${new Date().getTime()}`, {
                cache: 'no-store',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('API Error fetchDetail:', error);
            return null;
        }
    },

    async createRecipe(data) {
        try {
            const response = await fetchWithFailover(`/recipes/`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ data: data })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error createRecipe:', error);
            return null;
        }
    },

    async updateRecipe(id, data) {
        try {
            const response = await fetchWithFailover(`/recipes/${id}/`, {
                method: 'PUT',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ data: data, is_active: true })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error updateRecipe:', error);
            return null;
        }
    },

    async deleteRecipe(id) {
        try {
            const response = await fetchWithFailover(`/recipes/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.status === 204) return true;
            return false;
        } catch (error) {
            console.error('API Error deleteRecipe:', error);
            return false;
        }
    },

    // --- RECIPE BOOKS & TAXONOMY ---
    async fetchBooks() {
        try {
            const response = await fetchWithFailover(`/recipe-books/`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('API Error fetchBooks:', error);
            return [];
        }
    },

    async createBook(name, data = {}) {
        try {
            const response = await fetchWithFailover(`/recipe-books/`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ name: name, data: data })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error createBook:', error);
            return null;
        }
    },

    async updateBook(id, name, data) {
        try {
            const payload = {};
            if (name) payload.name = name;
            if (data) payload.data = data;

            const response = await fetchWithFailover(`/recipe-books/${id}/`, {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error updateBook:', error);
            return null;
        }
    }
};
