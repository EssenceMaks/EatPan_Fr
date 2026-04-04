// --- ENVIRONMENT TOGGLE ---
export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE = IS_LOCAL
    ? 'http://localhost:6600/api/v1'
    : 'https://api.eatpan.com/api/v1'; // Наш Cloudflare Worker балансувальник

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

export const RecipeService = {
    // --- RECIPES ---
    async fetchAll(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            params.append('_t', new Date().getTime()); // Вбиваємо кеш браузера
            const url = `${API_BASE}/recipes/?${params.toString()}`;
            const response = await fetch(url, {
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
            const response = await fetch(`${API_BASE}/recipes/${id}/?_t=${new Date().getTime()}`, {
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
            const response = await fetch(`${API_BASE}/recipes/`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                // Бекенд чекає поле `data` типу JSONB
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
            const response = await fetch(`${API_BASE}/recipes/${id}/`, {
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
            const response = await fetch(`${API_BASE}/recipes/${id}/`, {
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
            const response = await fetch(`${API_BASE}/recipe-books/`, {
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
            const response = await fetch(`${API_BASE}/recipe-books/`, {
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

            const response = await fetch(`${API_BASE}/recipe-books/${id}/`, {
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
