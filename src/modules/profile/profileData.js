import { RecipeService } from '../../api/RecipeService.js';

const DEFAULT_PROFILE = {
    name: 'Maks Cook',
    email: 'maks.cook@eatpan.dev',
    handle: '@maks_cook',
    location: 'Kyiv, Ukraine',
    bio: 'Люблю збирати рецепти, тестувати нові поєднання смаків і перетворювати кулінарні нотатки на красиві колекції.',
    joinedLabel: 'У спільноті з березня 2026'
};

let recipesCachePromise = null;

function capitalize(chunk) {
    return chunk ? chunk.charAt(0).toUpperCase() + chunk.slice(1) : '';
}

function normalizeEmail(email) {
    return String(email ?? '').trim().toLowerCase();
}

function buildDisplayName(email) {
    const localPart = normalizeEmail(email).split('@')[0] || 'cook';
    return localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map(capitalize)
        .join(' ') || 'Cook';
}

function getInitials(name) {
    const source = String(name || 'EP').trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
}

function buildHandle(name, email) {
    const fromName = String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-zа-яіїєґ0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');

    if (fromName) {
        return `@${fromName}`;
    }

    return `@${normalizeEmail(email).split('@')[0] || 'eatpan_cook'}`;
}

function normalizeRecipe(recipe, index) {
    const data = recipe?.data || {};
    const title = String(data.title || '').trim() || `Recipe ${index + 1}`;

    return {
        id: recipe?.id ?? `recipe-${index}`,
        title,
        subtitle: String(data.subtitle || '').trim() || 'Збережений рецепт для вашої кулінарної книги.',
        category: String(data.category || '').trim() || 'Без категорії',
        time: String(data.time_str || '').trim() || '25 хв',
        books: Array.isArray(data.books) ? data.books.filter(Boolean) : [],
        cover: `linear-gradient(135deg, rgba(107, 13, 18, ${0.78 - (index % 3) * 0.08}), rgba(128, 85, 51, 0.94))`
    };
}

export function buildProfilePayload(user, recipes = []) {
    const email = normalizeEmail(user?.email || DEFAULT_PROFILE.email);
    const name = String(user?.name || '').trim() || buildDisplayName(email) || DEFAULT_PROFILE.name;
    const normalizedRecipes = recipes.map(normalizeRecipe);
    const ownRecipes = normalizedRecipes.slice(0, 6);
    const fallbackFavoritesSource = normalizedRecipes.length > 6
        ? normalizedRecipes.slice(2)
        : normalizedRecipes;
    const favoriteRecipes = fallbackFavoritesSource.slice(0, 6);
    const followers = 120 + normalizedRecipes.length * 3;
    const following = 32 + normalizedRecipes.length;
    const collections = new Set(normalizedRecipes.flatMap(recipe => recipe.books)).size || 3;

    return {
        user: {
            name,
            email,
            handle: String(user?.handle || '').trim() || buildHandle(name, email),
            location: String(user?.location || DEFAULT_PROFILE.location).trim(),
            bio: String(user?.bio || DEFAULT_PROFILE.bio).trim(),
            joinedLabel: String(user?.joinedLabel || DEFAULT_PROFILE.joinedLabel).trim(),
            initials: getInitials(name)
        },
        stats: [
            { label: 'Рецептів', value: ownRecipes.length || normalizedRecipes.length || 6, icon: 'book-open-text' },
            { label: 'Фоловерів', value: followers, icon: 'users' },
            { label: 'Підписок', value: following, icon: 'user-plus' },
            { label: 'Колекцій', value: collections, icon: 'folders' }
        ],
        highlights: [
            'Сезонні добірки та особисті нотатки до страв.',
            'Улюблені рецепти завжди під рукою у профільній книжці.',
            'Швидкий доступ до власних колекцій і соціальної статистики.'
        ],
        achievements: [
            { label: 'Улюблені рецепти', value: favoriteRecipes.length || 4 },
            { label: 'Створені добірки', value: collections },
            { label: 'Середній час страв', value: ownRecipes[0]?.time || '35 хв' }
        ],
        ownRecipes: ownRecipes.length ? ownRecipes : [
            {
                id: 'demo-own-1',
                title: 'Лимонний ризото',
                subtitle: 'Кремова текстура з цитрусовою свіжістю.',
                category: 'Паста',
                time: '30 хв',
                books: ['Особисті'],
                cover: 'linear-gradient(135deg, rgba(107, 13, 18, 0.8), rgba(128, 85, 51, 0.95))'
            },
            {
                id: 'demo-own-2',
                title: 'Курка з травами',
                subtitle: 'Запечене філе з ароматним маслом.',
                category: 'Птиця',
                time: '45 хв',
                books: ['Особисті'],
                cover: 'linear-gradient(135deg, rgba(44, 24, 16, 0.86), rgba(107, 13, 18, 0.9))'
            }
        ],
        favoriteRecipes: favoriteRecipes.length ? favoriteRecipes : [
            {
                id: 'demo-favorite-1',
                title: 'Суп дня',
                subtitle: 'Теплий сезонний суп із насиченим смаком.',
                category: 'Супи',
                time: '20 хв',
                books: ['Гості'],
                cover: 'linear-gradient(135deg, rgba(128, 85, 51, 0.88), rgba(220, 201, 158, 0.95))'
            },
            {
                id: 'demo-favorite-2',
                title: 'Шоколадний тарт',
                subtitle: 'Ніжний десерт для святкових вечорів.',
                category: 'Десерти',
                time: '55 хв',
                books: ['Закладки'],
                cover: 'linear-gradient(135deg, rgba(44, 24, 16, 0.9), rgba(107, 13, 18, 0.92))'
            }
        ]
    };
}

export async function getProfilePayload(user) {
    if (!recipesCachePromise) {
        recipesCachePromise = RecipeService.fetchAll();
    }

    const recipes = await recipesCachePromise;
    return buildProfilePayload(user, Array.isArray(recipes) ? recipes : []);
}
