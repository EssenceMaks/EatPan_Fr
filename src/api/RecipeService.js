const API_BASE = 'https://your-django-backend.com/api/v1';

export const RecipeService = {
    async fetchAll() {
        try {
            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 500));
            // Return mock data for now
            return [
                { id: 1, title: 'Steak', category: 'meat' },
                { id: 2, title: 'Salad', category: 'greens' }
            ];
            // const response = await fetch(`${API_BASE}/recipes/`);
            // return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    async fetchDetail(id) {
        try {
            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return { id, title: 'Sample Recipe', content: 'Delicious instructions here.' };
            // const response = await fetch(`${API_BASE}/recipes/${id}/`);
            // return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};
