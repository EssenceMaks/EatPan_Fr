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
        cover: `linear-gradient(135deg, rgba(107, 13, 18, ${0.78 - (index % 3) * 0.08}), rgba(128, 85, 51, 0.94))`,
        author_username: recipe?.author_username,
        is_public: recipe?.is_public
    };
}

function getCurrentUserId() {
    try {
        const raw = window.localStorage.getItem('eatpan_header_auth_user');
        if (raw) {
            const user = JSON.parse(raw);
            return user?.id || 'guest';
        }
    } catch {}
    return 'guest';
}

function getLikesKey() {
    return `eatpan_liked_recipes_${getCurrentUserId()}`;
}

export function getLikedRecipeIds() {
    try {
        const raw = window.localStorage.getItem(getLikesKey());
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function toggleLikeRecipe(id) {
    const likes = getLikedRecipeIds();
    const index = likes.indexOf(id);
    if (index > -1) {
        likes.splice(index, 1);
    } else {
        likes.push(id);
    }
    window.localStorage.setItem(getLikesKey(), JSON.stringify(likes));
    
    // Auto-update profile page if it's open
    if (window.profileModule && window.profileModule.element) {
        window.profileModule.loadProfile();
    }
}

export function buildProfilePayload(user, recipes = []) {
    const email = normalizeEmail(user?.email || DEFAULT_PROFILE.email);
    const name = String(user?.name || '').trim() || buildDisplayName(email) || DEFAULT_PROFILE.name;
    const normalizedRecipes = recipes.map(normalizeRecipe);
    
    // User ID is available from Supabase payload (user.id). 
    // This perfectly matches the Django username.
    const userId = user?.id || null;
    const ownRecipes = normalizedRecipes.filter(r => r.author_username === userId);
    
    const likedIds = getLikedRecipeIds();
    const favoriteRecipes = normalizedRecipes.filter(r => likedIds.includes(String(r.id)));

    const followers = 0;
    const following = 0;

    const myGroups = new Set();
    ownRecipes.forEach(r => {
        if (r.books && Array.isArray(r.books)) {
            r.books.forEach(b => myGroups.add(b));
        }
    });
    if (myGroups.size === 0) myGroups.add('Особисто');
    const groupsCount = myGroups.size;

    return {
        user: {
            name,
            email,
            handle: String(user?.handle || '').trim() || buildHandle(name, email),
            location: String(user?.location || DEFAULT_PROFILE.location).trim(),
            bio: String(user?.bio || DEFAULT_PROFILE.bio).trim(),
            joinedLabel: String(user?.joinedLabel || DEFAULT_PROFILE.joinedLabel).trim(),
            initials: getInitials(name),
            avatar: user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
        },
        stats: [
            { label: 'Рецептів', value: ownRecipes.length || 0, icon: 'book-open-text' },
            { label: 'Фоловерів', value: followers, icon: 'users' },
            { label: 'Підписок', value: following, icon: 'user-plus' },
            { label: 'Групи', value: groupsCount, icon: 'folders' }
        ],
        highlights: [
            'Сезонні добірки та особисті нотатки до страв.',
            'Улюблені рецепти завжди під рукою у профільній книжці.',
            'Швидкий доступ до власних колекцій і соціальної статистики.'
        ],
        achievements: [
            { label: 'Улюблені рецепти', value: favoriteRecipes.length },
            { label: 'Створені добірки', value: groupsCount },
            { label: 'Середній час страв', value: '0 хв' }
        ],
        ownRecipes: ownRecipes,
        favoriteRecipes: favoriteRecipes
    };
}

export async function getProfilePayload(user, forceRefresh = false) {
    if (!recipesCachePromise || forceRefresh) {
        recipesCachePromise = RecipeService.fetchAll();
    }

    const recipes = await recipesCachePromise;
    return buildProfilePayload(user, Array.isArray(recipes) ? recipes : []);
}
