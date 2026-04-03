import Component from '../../core/Component.js';
import { buildProfilePayload, getProfilePayload } from './profileData.js';

export default class ProfileModule extends Component {
    constructor(props = {}) {
        super(props);
        this.profile = buildProfilePayload(props.user, []);
        this.hasInitialized = false;
        this.activeView = 'own'; // 'own' | 'fav'
        this.activeTab = 'public'; // 'public' | 'private'
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

    async loadProfile(user = this.props.user, forceRefresh = false) {
        this.profile = await getProfilePayload(user, forceRefresh);
        this.props = { ...this.props, user };
        await this.update({ user });
    }

    async refresh() {
        await this.loadProfile(this.props.user, true);
    }

    async setUser(user) {
        await this.loadProfile(user);
    }

    renderRecipeCards(recipes, toneClass) {
        return recipes.map(recipe => `
            <article class="profile-recipe-card ${toneClass}" data-open-recipe="${recipe.id}">
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
                                    <span class="profile-page-kicker">ABOUT</span>
                                    <h2 class="text-h2">Що видно в профілі</h2>
                                </div>
                                <ul class="profile-highlight-list">
                                    ${profile.highlights.map(h => `
                                        <li>
                                            <i data-lucide="check-circle-2"></i>
                                            <span>${h}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                                <div class="profile-achievement-row">
                                    ${profile.achievements.map(a => `
                                        <div class="profile-achievement-card">
                                            <span>${a.label}</span>
                                            <strong>${a.value}</strong>
                                        </div>
                                    `).join('')}
                                </div>
                            </section>

                            <section class="profile-page-card profile-page-card--navigation" style="margin-top: 16px;">
                                <div class="profile-page-card-head">
                                    <span class="profile-page-kicker">Navigation</span>
                                    <h2 class="text-h2">Розділи</h2>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                                    <button class="profile-page-btn" style="width: 100%; justify-content: flex-start; padding: 16px; background: ${this.activeView === 'own' ? '#eae8e1' : '#f5f4f0'}; border: 1px solid #d1cfc7;" data-set-view="own">
                                        <i data-lucide="book-open-text" style="margin-right: 12px; color: #578c54;"></i>
                                        <strong>Особисті рецепти</strong>
                                    </button>
                                    <button class="profile-page-btn" style="width: 100%; justify-content: flex-start; padding: 16px; background: ${this.activeView === 'fav' ? '#eae8e1' : '#f5f4f0'}; border: 1px solid #d1cfc7;" data-set-view="fav">
                                        <i data-lucide="heart" style="margin-right: 12px; color: #d9534f;"></i>
                                        <strong>Улюблені рецепти</strong>
                                    </button>
                                </div>
                            </section>
                        </section>

                        <div class="profile-book-spine"></div>

                        <section class="profile-book-page profile-book-page--right">
                            ${this.activeView === 'own' ? `
                                <section class="profile-page-card profile-page-card--recipes">
                                    <div class="profile-page-card-head" style="flex-direction: column; align-items: flex-start; gap: 16px;">
                                        <div>
                                            <span class="profile-page-kicker">Own Recipes</span>
                                            <h2 class="text-h2">Особисті рецепти</h2>
                                        </div>
                                        <div class="profile-tabs" style="display: flex; gap: 8px;">
                                            <button class="profile-page-btn ${this.activeTab === 'public' ? '' : 'profile-page-btn--ghost'}" data-set-tab="public">Публічні</button>
                                            <button class="profile-page-btn ${this.activeTab === 'private' ? '' : 'profile-page-btn--ghost'}" data-set-tab="private">Особисті</button>
                                        </div>
                                    </div>
                                     <!-- Temporary empty grid for own recipes -->
                                     <div class="profile-recipes-grid" style="margin-top: 16px;">
                                         ${(() => {
                                             const targetFlag = this.activeTab === 'public';
                                             const filteredOwnRecipes = profile.ownRecipes.filter(r => !!r.is_public === targetFlag);
                                             return filteredOwnRecipes.length 
                                                ? this.renderRecipeCards(filteredOwnRecipes, 'profile-recipe-card--own') 
                                                : '<p style="color: #aba79d; font-style: italic;">Тут поки немає рецептів.</p>';
                                         })()}
                                     </div>
                                 </section>
                            ` : `
                                <section class="profile-page-card profile-page-card--recipes">
                                    <div class="profile-page-card-head">
                                        <span class="profile-page-kicker">Favorites</span>
                                        <h2 class="text-h2">Улюблені рецепти</h2>
                                    </div>
                                    <div class="profile-recipes-grid">
                                        ${profile.favoriteRecipes.length ? this.renderRecipeCards(profile.favoriteRecipes, 'profile-recipe-card--favorite') : '<p style="color: #aba79d; font-style: italic;">Улюблених рецептів ще немає.</p>'}
                                    </div>
                                </section>
                            `}
                        </section>
                    </div>
                </div>
            </section>
        `;
    }

    attachEvents() {
        this.element.addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('[data-set-view]');
            if (viewBtn) {
                const view = viewBtn.dataset.setView;
                if (this.activeView !== view) {
                    this.activeView = view;
                    await this.update();
                }
                return;
            }

            const tabBtn = e.target.closest('[data-set-tab]');
            if (tabBtn) {
                const tab = tabBtn.dataset.setTab;
                if (this.activeTab !== tab) {
                    this.activeTab = tab;
                    await this.update();
                }
                return;
            }

            const recipeCard = e.target.closest('[data-open-recipe]');
            if (recipeCard) {
                const recipeId = recipeCard.dataset.openRecipe;
                if (window.openRecipe) {
                    window.openRecipe(recipeId);
                    
                    // Close the profile drawer if it's open via HeaderAuthModule
                    if (window.headerAuthModule) {
                        window.headerAuthModule.state.isDrawerOpen = false;
                        await window.headerAuthModule.refresh();
                    }
                }
            }
        });
    }
}
