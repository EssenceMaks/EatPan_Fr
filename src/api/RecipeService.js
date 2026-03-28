const API_BASE = 'http://localhost:8000/api/v1';

export const RecipeService = {
    // --- RECIPES ---
    async fetchAll(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            params.append('_t', new Date().getTime()); // Вбиваємо кеш браузера
            const url = `${API_BASE}/recipes/?${params.toString()}`;
            const response = await fetch(url, { cache: 'no-store' });
            return await response.json();
        } catch (error) {
            console.error('API Error fetchAll:', error);
            return [];
        }
    },

    async fetchDetail(id) {
        try {
            const response = await fetch(`${API_BASE}/recipes/${id}/?_t=${new Date().getTime()}`, { cache: 'no-store' });
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
                method: 'DELETE'
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
            const response = await fetch(`${API_BASE}/recipe-books/`);
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error updateBook:', error);
            return null;
        }
    }
};
