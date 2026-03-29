import Component from '../../core/Component.js';
import { buildProfilePayload, getProfilePayload } from './profileData.js';

export default class ProfileModule extends Component {
    constructor(props = {}) {
        super(props);
        this.profile = buildProfilePayload(props.user, []);
        this.hasInitialized = false;
    }

    async onMount() {
        if (this.hasInitialized) {
            if (window.lucide) {
                window.lucide.createIcons({ root: this.element });
            }
            return;
        }

        this.hasInitialized = true;
        await this.loadProfile(this.props.user);
    }

    async loadProfile(user = this.props.user) {
        this.profile = await getProfilePayload(user);
        this.props = { ...this.props, user };
        await this.update({ user });
    }

    async setUser(user) {
        await this.loadProfile(user);
    }

    renderRecipeCards(recipes, toneClass) {
        return recipes.map(recipe => `
            <article class="profile-recipe-card ${toneClass}">
                <div class="profile-recipe-cover" style="background:${recipe.cover}">
                    <span class="profile-recipe-pill">${recipe.category}</span>
                </div>
                <div class="profile-recipe-copy">
                    <h4>${recipe.title}</h4>
                    <p>${recipe.subtitle}</p>
                    <div class="profile-recipe-meta">
                        <span><i data-lucide="clock-3"></i>${recipe.time}</span>
                        <span><i data-lucide="folder-kanban"></i>${recipe.books[0] || 'Колекція'}</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    template() {
        const profile = this.profile;
        const user = profile.user;

        return `
            <section class="profile-page-shell">
                <div class="profile-book-wrapper">
                    <div class="profile-book-cover">
                        <section class="profile-book-page profile-book-page--left">
                            <header class="profile-page-toolbar">
                                <div>
                                    <span class="profile-page-kicker">Kitchen Profile</span>
                                    <h1 class="profile-page-title">${user.name}</h1>
                                    <p class="text-subtitle">Персональна книжка рецептів, статистики та добірок.</p>
                                </div>
                                <div class="profile-page-actions">
                                    <button class="profile-page-btn profile-page-btn--ghost" type="button" onclick="window.goBack()">Назад</button>
                                    <button class="profile-page-btn" type="button">Редагувати профіль</button>
                                </div>
                            </header>

                            <div class="profile-page-hero-card">
                                <div class="profile-page-hero-ribbon">Profile</div>
                                <div class="profile-page-identity">
                                    <div class="profile-page-avatar">${user.initials}</div>
                                    <div class="profile-page-copy">
                                        <p class="profile-page-handle">${user.handle}</p>
                                        <p class="profile-page-bio">${user.bio}</p>
                                        <div class="profile-page-meta-row">
                                            <span><i data-lucide="map-pin"></i>${user.location}</span>
                                            <span><i data-lucide="sparkles"></i>${user.joinedLabel}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <section class="profile-page-card profile-page-card--stats">
                                <div class="profile-page-card-head">
                                    <span class="profile-page-kicker">Stats</span>
                                    <h2 class="text-h2">Базова статистика</h2>
                                </div>
                                <div class="profile-stat-grid">
                                    ${profile.stats.map(stat => `
                                        <div class="profile-stat-card">
                                            <span class="profile-stat-icon"><i data-lucide="${stat.icon}"></i></span>
                                            <strong>${stat.value}</strong>
                                            <span>${stat.label}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </section>

                            <section class="profile-page-card profile-page-card--notes">
                                <div class="profile-page-card-head">
                                    <span class="profile-page-kicker">About</span>
                                    <h2 class="text-h2">Що видно в профілі</h2>
                                </div>
                                <ul class="profile-highlight-list">
                                    ${profile.highlights.map(item => `
                                        <li>
                                            <i data-lucide="check-circle-2"></i>
                                            <span>${item}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                                <div class="profile-achievement-row">
                                    ${profile.achievements.map(item => `
                                        <div class="profile-achievement-card">
                                            <span>${item.label}</span>
                                            <strong>${item.value}</strong>
                                        </div>
                                    `).join('')}
                                </div>
                            </section>
                        </section>

                        <div class="profile-book-spine"></div>

                        <section class="profile-book-page profile-book-page--right">
                            <section class="profile-page-card profile-page-card--recipes">
                                <div class="profile-page-card-head">
                                    <span class="profile-page-kicker">Own Recipes</span>
                                    <h2 class="text-h2">Власні рецепти</h2>
                                </div>
                                <div class="profile-recipes-grid">
                                    ${this.renderRecipeCards(profile.ownRecipes, 'profile-recipe-card--own')}
                                </div>
                            </section>

                            <section class="profile-page-card profile-page-card--recipes">
                                <div class="profile-page-card-head">
                                    <span class="profile-page-kicker">Favorites</span>
                                    <h2 class="text-h2">Улюблені рецепти</h2>
                                </div>
                                <div class="profile-recipes-grid">
                                    ${this.renderRecipeCards(profile.favoriteRecipes, 'profile-recipe-card--favorite')}
                                </div>
                            </section>
                        </section>
                    </div>
                </div>
            </section>
        `;
    }
}
