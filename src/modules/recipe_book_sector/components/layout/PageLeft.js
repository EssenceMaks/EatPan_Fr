import Component from '../../../../core/Component.js';

export default class PageLeft extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeBook: 'all', // 'all', 'my', 'guests', 'places'
            viewMode: 'grid',  // 'grid', 'list'
            activeCategory: 'all' // icon key or 'all'
        };
        
        // Expose state mutator so inline HTML string clicks can update state
        window.setPageLeftState = (newState) => {
            this.state = { ...this.state, ...newState };
            this.update(this.props);
        };

        window.onRecipeSelectCall = (recipeId) => {
            // Find recipe object
            const recipe = (this.props.recipes || []).find(r => String(r.id) === String(recipeId));
            if (this.props.onRecipeSelect) {
                this.props.onRecipeSelect(recipe);
            }
        };
    }

    getFilteredRecipes() {
        const bookName = {
            'all': 'Всі рецепти',
            'my': 'Особисті',
            'guests': 'Гості',
            'places': 'Заклади'
        }[this.state.activeBook];

        let filtered = (this.props.recipes || []).filter(r => {
            if (this.state.activeBook === 'all') return true;
            return r.data && r.data.books && r.data.books.includes(bookName);
        });

        const iconToCat = {
            'soup': 'Супи', 'beef': 'М\'ясо', 'drumstick': 'Птиця',
            'fish': 'Риба', 'shrimp': 'Морепродукти', 'utensils': 'Паста',
            'leaf': 'Салати', 'wheat': 'Випічка', 'cake-slice': 'Десерти', 'coffee': 'Напої'
        };

        if (this.state.activeCategory !== 'all') {
            const catStr = iconToCat[this.state.activeCategory];
            if (catStr) {
                filtered = filtered.filter(r => r.data && r.data.category === catStr);
            }
        }
        return filtered;
    }

    buildHierarchy(recipes) {
        // Build taxonomy grouped for List Accordion
        const hierarchy = {};
        recipes.forEach(r => {
            let cat = r.data && r.data.category ? r.data.category : 'Без категорії';
            let mainGroup = cat; // Default
            
            // Re-map per UI logic
            if (cat === "М'ясо") { mainGroup = "М'ясні страви"; cat = "Яловичина"; }
            if (cat === "Птиця") { mainGroup = "М'ясні страви"; cat = "Курка"; }
            if (cat === "Паста" || cat === "Салати") { mainGroup = "Гарніри"; }
            
            if (!hierarchy[mainGroup]) hierarchy[mainGroup] = {};
            if (!hierarchy[mainGroup][cat]) hierarchy[mainGroup][cat] = [];
            hierarchy[mainGroup][cat].push(r);
        });
        return hierarchy;
    }

    renderListView(hierarchy) {
        if (Object.keys(hierarchy).length === 0) {
            return `<div style="padding: 20px; text-align: center; color: var(--text-muted);">Немає рецептів у цій категорії.</div>`;
        }

        const getMainGroupIcon = (name) => {
            const m = {
                "Супи": "soup", "М'ясні страви": "beef", "Гарніри": "wheat",
                "Риба та Морепродукти": "fish", "Випічка та Десерти": "cake-slice",
                "Напої": "coffee", "Без категорії": "help-circle"
            };
            return m[name] || "utensils";
        };

        return Object.entries(hierarchy).map(([mainGroupName, subCats]) => {
            const subGroupsHTML = Object.entries(subCats).map(([subGroupName, recList]) => {
                const recipesHTML = recList.map(r => `
                    <div class="list-recipe-item" onclick="window.onRecipeSelectCall(${r.id})" style="padding: 6px 0; cursor: pointer; display: flex; align-items: center; color: var(--text-main); font-size: 14px;">
                        <span style="color:var(--brand-red); margin-right:8px; font-size: 18px;">•</span> 
                        <span class="recipe-title-hover">${r.data.title || 'Без назви'}</span>
                    </div>
                `).join('');

                if (mainGroupName === subGroupName) {
                    // direct group
                    return `<div style="padding-left:15px; margin-top:5px;">${recipesHTML}</div>`;
                } else {
                    // nested subgroup
                    return `
                        <div style="padding-left: 15px; margin-top: 10px;">
                            <div onclick="const n = this.nextElementSibling; n.style.display = n.style.display==='none'?'block':'none';" style="cursor:pointer; display:flex; justify-content:space-between; color:#4a3f35; font-weight:bold; font-size: 15px; border-bottom: 1px dotted rgba(0,0,0,0.1); padding-bottom: 4px;">
                                ${subGroupName}
                                <i data-lucide="chevron-down" style="width:14px; opacity:0.6;"></i>
                            </div>
                            <div style="display:none; padding-left:15px; margin-top:5px;">
                                ${recipesHTML}
                            </div>
                        </div>
                    `;
                }
            }).join('');

            return `
                <div style="border-bottom:1px solid #e0dbce; padding: 12px 0;">
                    <div onclick="const n = this.nextElementSibling; n.style.display = n.style.display==='none'?'block':'none';" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-family:'Playfair Display', serif; font-size:18px; color:#4a3f35;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i data-lucide="${getMainGroupIcon(mainGroupName)}" style="width:20px; color:var(--brand-red);"></i>
                            ${mainGroupName}
                        </div>
                        <i data-lucide="chevron-down" style="width:16px;"></i>
                    </div>
                    <div style="display:none; padding-top:10px;">
                        ${subGroupsHTML}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderGridView(recipes) {
        if (this.state.activeCategory === 'all') {
            // Render category tiles
            const catImgs = {
                "М'ясо": "https://lh3.googleusercontent.com/aida-public/AB6AXuCFQJX4a4czScihK-ImNo9rJk25Dadxma00W6aI8_EW2o4kSFlpqSqyPu82cyo4msu90zq2euVgVp7eRpfFITwHsXMANprRn3AQCMOUe_pzjZEA950_Oh7p6SQ9falr3Cej3ojb35QM3fDrxVVpQnvkAtwZBpfory0vZh2etpdnag3EfEuo7u_lrfBuHphba3ckh6Br_WmTqQK15ZQvaPZdEqssfo8QpWJcSgK_qKDYRAJpAYr3l4bzV85RXPifJRe_N15lVkzk9S2b",
                "Птиця": "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ4p8i0GofuBpQqrlpOb3iYCoNFO9hPt_oaI4Q5t2S-ZonDtEQ2jT-ARspcHAwwDyUC0o1cNap9SyvwwoN9n9uyA7a0-13KoUpMkBk87AMZ5a0UnKa5XiA3RWjIOxVlOWeXpHRZ2l9LWmzVpMk3cje49GIZuUesm2bDgTk3GoRLMd9IGkjDXRVhn--AdovqTwnD39mPgJOaGH3y4-9pjhaZrLiDHxlaGwKQUGW3Ai-T5Cipj7hi2fkLmW-Zk2cjCEbX1sdzLZE-0V-",
                "Паста": "https://lh3.googleusercontent.com/aida-public/AB6AXuBQmrfvgR4KaIXMFA7ntHy2Gz0DnWzWIjXcXRU8RmbPTtRelOa1zfZD7JZj_HrtOzcovTbia8ogFhYQI5IWUXYLE6yV0HQQJQlhEuTeCSH_x8ld0S_u_qzom5VbGJWTrcLWKITzcVg2O5mRkIIyzlGVhDSVEM3_qwuNQ3_NtWdJLAnDUXXxFYLjlIQefu6X8Dr1b0n9O7Hq-Rjbq1TO905pvIV8es1xQ-uIGd_OonIdQaENOZLRCT8N7J_6MgzVM20Jq6WDdpzdgYOK",
                "Супи": "https://images.unsplash.com/photo-1547592180-85f173990554",
            };
            
            const existingCats = new Set(recipes.map(r => r.data && r.data.category ? r.data.category : "Без категорії"));
            
            const cards = Array.from(existingCats).map(cat => {
                const img = catImgs[cat] || catImgs["Супи"]; // fallback
                const iconMapper = {'Супи': 'soup', 'М\'ясо': 'beef', 'Птиця': 'drumstick', 'Паста': 'utensils'};
                const actionIcon = iconMapper[cat] || 'utensils';
                return `
                    <div class="category-card" onclick="window.setPageLeftState({ activeCategory: '${actionIcon}', viewMode: 'grid' })">
                        <img alt="${cat}" class="category-card-img" src="${img}" />
                        <div class="category-card-pill" style="text-transform:uppercase;">${cat}</div>
                    </div>
                `;
            });
            
            return `
                <div class="category-cards-grid">
                    ${cards.join('')}
                    <div class="category-card category-card--all" onclick="window.setPageLeftState({ activeCategory: 'all', viewMode: 'list' })">
                        <span>ALL CATEGORIES</span>
                    </div>
                </div>
            `;
        } else {
            // Render recipes as tiles
            if (recipes.length === 0) {
                return `<div style="padding: 20px; text-align: center; color: var(--text-muted);">Тут пусто. Створіть новий рецепт.</div>`;
            }
            
            const recCards = recipes.map(r => `
                <div class="category-card" onclick="window.onRecipeSelectCall(${r.id})" style="border: 2px solid #5a4f45; border-radius: 8px; overflow: hidden; position: relative;">
                    <div style="background: var(--brand-red); width: 100%; height: 100px; display:flex; align-items:center; justify-content:center;">
                        <i data-lucide="chef-hat" style="color:#fff; width:32px; height:32px;"></i>
                    </div>
                    <div style="padding: 10px; background:#fff; height:100%;">
                        <div style="font-family:'Playfair Display',serif; font-weight:bold; font-size: 14px;">${r.data.title || 'Без назви'}</div>
                        <div style="font-size: 12px; color: #888; display:flex; align-items:center; gap:4px; margin-top:4px;">
                            <i data-lucide="clock" style="width:12px;"></i> ${r.data.time_str || '-'}
                        </div>
                    </div>
                </div>
            `).join('');
            
            return `
                <div class="category-cards-grid recipe-cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));">
                    ${recCards}
                </div>
            `;
        }
    }

    template() {
        const book = this.state.activeBook;
        const view = this.state.viewMode;
        const cat = this.state.activeCategory;
        
        // Data logic
        const activeRecipesForView = this.getFilteredRecipes();
        const hierarchyForList = this.buildHierarchy(activeRecipesForView);

        // Build View Content
        const viewContentHTML = view === 'list' 
            ? `<div class="categories-list-view" style="padding-top:10px;">${this.renderListView(hierarchyForList)}</div>`
            : this.renderGridView(activeRecipesForView);

        return `
            <section class="page page--left">
                <div class="mobile-main-title">
                    <h1 class="text-h1 uppercase">ВСІ РЕЦЕПТИ</h1>
                    <p class="text-subtitle">Discover a limitless world of culinary possibilities...</p>
                </div>
                <!-- Inner Header Tabs -->
                <header class="inner-tabs-header">
                    <div class="inner-tabs-group">
                        <button class="tab-btn--top ${book === 'all' ? 'active' : ''}" onclick="window.setPageLeftState({ activeBook: 'all' })">Всі рецепти</button>
                        <button class="tab-btn--top ${book === 'my' ? 'active' : ''}" onclick="window.setPageLeftState({ activeBook: 'my' })">Особисті</button>
                        <button class="tab-btn--top ${book === 'guests' ? 'active' : ''}" onclick="window.setPageLeftState({ activeBook: 'guests' })">Гості</button>
                        <button class="tab-btn--top ${book === 'places' ? 'active' : ''}" onclick="window.setPageLeftState({ activeBook: 'places' })">Заклади</button>
                    </div>
                    <div>
                        <button class="tab-btn--top" onclick="window.toggleCreateRecipe()"><i data-lucide="plus" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </header>

                <!-- LEFT SIDE CATEGORY TABS -->
                <aside class="side-tabs-container side-tabs--left-top" id="side-tabs-categories">
                    ${['soup','beef','drumstick','fish','shrimp','utensils','leaf','wheat','cake-slice','coffee'].map(icon => `
                        <div class="side-tab--left ${cat === icon ? 'active' : ''}" onclick="window.setPageLeftState({ activeCategory: '${icon}', viewMode: 'list' })">
                            <i data-lucide="${icon}" style="width: 18px;"></i>
                        </div>
                    `).join('')}
                    <!-- Click active selected tab again to reset to 'all' -->
                    ${cat !== 'all' ? `<div class="side-tab--left" style="margin-top:20px; color:var(--brand-red);" onclick="window.setPageLeftState({ activeCategory: 'all' })"><i data-lucide="x" style="width: 18px;"></i></div>` : ''}
                </aside>

                <!-- LEFT SIDE HEALTH TABS -->
                <aside class="side-tabs-container side-tabs--left-bottom">
                    <div class="side-tab--left" title="Фрукти"><i data-lucide="banana" style="width: 18px;"></i></div>
                    <div class="side-tab--left" title="Бади"><i data-lucide="pill" style="width: 18px;"></i></div>
                    <div class="side-tab--left" title="Аптечка"><i data-lucide="circle-plus" style="width: 18px; color: var(--brand-red);"></i></div>
                    <div class="side-tab--left" title="Алергени"><i data-lucide="alert-triangle" style="width: 18px; color: var(--brand-red);"></i></div>
                    <div class="side-tab--left" title="Е-Добавки"><i data-lucide="skull" style="width: 18px; color: var(--brand-red);"></i>E</div>
                </aside>

                <!-- Scrollable Content -->
                <div class="scrollable-area page-content-wrapper">
                    <div class="categories-grid-view">
                        <div class="categories-header-wrap">
                            <div>
                                <h1 class="text-h1">${cat === 'all' && view === 'grid' ? "CATEGORIES" : (cat !== 'all' ? "РЕЦЕПТИ" : "СПИСОК РЕЦЕПТІВ")}</h1>
                                <p class="text-subtitle">Discover a limitless world of culinary possibilities...</p>
                            </div>
                            <div class="category-header-actions">
                                <button class="btn-action--tactile ${view === 'grid' ? 'active' : ''}" onclick="window.setPageLeftState({ viewMode: 'grid' })" title="Show Grid View"><i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i></button>
                                <button class="btn-action--tactile ${view === 'list'  ? 'active' : ''}" onclick="window.setPageLeftState({ viewMode: 'list' })" title="Show List View"><i data-lucide="list" style="width: 16px; height: 16px;"></i></button>
                            </div>
                        </div>
                        
                        <!-- MAIN CONTENT LIST OR GRID -->
                        ${viewContentHTML}

                    </div>
                </div>

                <!-- LEFT BOTTOM RIBBONS -->
                <div class="bookmark-bottom-group-left">
                    <button class="bookmark-bottom-left fridge"><i data-lucide="refrigerator" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left ingredients"><i data-lucide="flask-conical" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left prepared has-items"><i data-lucide="soup" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left planned"><i data-lucide="timer" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left shopping active"><i data-lucide="shopping-basket" style="width: 25px; height: 25px;"></i></button>
                </div>

                <!-- CREATE MODE OVERLAY -->
                <div class="create-mode-content">
                    <h2 class="create-mode-title">Новий рецепт</h2>
                    <section class="create-section">
                        <h3 class="section-title">Додати до книги</h3>
                        <div class="create-checklist">
                            <label class="create-check-item"><input type="checkbox" name="book" value="all" checked> <span>Всі рецепти</span></label>
                            <label class="create-check-item"><input type="checkbox" name="book" value="personal"> <span>Особисті</span></label>
                            <label class="create-check-item"><input type="checkbox" name="book" value="guests"> <span>Гості</span></label>
                            <label class="create-check-item"><input type="checkbox" name="book" value="places"> <span>Заклади</span></label>
                        </div>
                    </section>
                    <section class="create-section">
                        <h3 class="section-title">Категорія</h3>
                        <div class="create-category-grid">
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="soup" style="width:18px;"></i><span>Супи</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="beef" style="width:18px;"></i><span>М'ясо</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="drumstick" style="width:18px;"></i><span>Птиця</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="fish" style="width:18px;"></i><span>Риба</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="shrimp" style="width:18px;"></i><span>Морепродукти</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="utensils" style="width:18px;"></i><span>Паста</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="leaf" style="width:18px;"></i><span>Салати</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="wheat" style="width:18px;"></i><span>Випічка</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="cake-slice" style="width:18px;"></i><span>Десерти</span></button>
                            <button class="create-cat-btn" type="button" onclick="window.selectCategory(this)"><i data-lucide="coffee" style="width:18px;"></i><span>Напої</span></button>
                        </div>
                        <div class="create-new-category">
                            <button class="create-icon-preview" type="button" id="selected-cat-icon" onclick="window.toggleIconPicker()" title="Обрати іконку">
                                <i data-lucide="help-circle" style="width:16px;"></i>
                            </button>
                            <input type="text" id="new-category-name" placeholder="Нова категорія...">
                            <button class="create-new-cat-btn" type="button" onclick="window.addCustomCategory()"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
                        </div>
                        <div class="create-icon-picker" id="create-icon-picker">
                            <button type="button" class="icon-pick-btn" data-icon="apple" onclick="window.pickCategoryIcon(this)"><i data-lucide="apple" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="banana" onclick="window.pickCategoryIcon(this)"><i data-lucide="banana" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="beef" onclick="window.pickCategoryIcon(this)"><i data-lucide="beef" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="beer" onclick="window.pickCategoryIcon(this)"><i data-lucide="beer" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="cake-slice" onclick="window.pickCategoryIcon(this)"><i data-lucide="cake-slice" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="candy" onclick="window.pickCategoryIcon(this)"><i data-lucide="candy" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="carrot" onclick="window.pickCategoryIcon(this)"><i data-lucide="carrot" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="cherry" onclick="window.pickCategoryIcon(this)"><i data-lucide="cherry" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="coffee" onclick="window.pickCategoryIcon(this)"><i data-lucide="coffee" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="cookie" onclick="window.pickCategoryIcon(this)"><i data-lucide="cookie" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="croissant" onclick="window.pickCategoryIcon(this)"><i data-lucide="croissant" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="cup-soda" onclick="window.pickCategoryIcon(this)"><i data-lucide="cup-soda" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="drumstick" onclick="window.pickCategoryIcon(this)"><i data-lucide="drumstick" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="egg-fried" onclick="window.pickCategoryIcon(this)"><i data-lucide="egg-fried" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="fish" onclick="window.pickCategoryIcon(this)"><i data-lucide="fish" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="grape" onclick="window.pickCategoryIcon(this)"><i data-lucide="grape" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="ham" onclick="window.pickCategoryIcon(this)"><i data-lucide="ham" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="ice-cream-cone" onclick="window.pickCategoryIcon(this)"><i data-lucide="ice-cream-cone" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="leaf" onclick="window.pickCategoryIcon(this)"><i data-lucide="leaf" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="milk" onclick="window.pickCategoryIcon(this)"><i data-lucide="milk" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="nut" onclick="window.pickCategoryIcon(this)"><i data-lucide="nut" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="pizza" onclick="window.pickCategoryIcon(this)"><i data-lucide="pizza" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="salad" onclick="window.pickCategoryIcon(this)"><i data-lucide="salad" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="sandwich" onclick="window.pickCategoryIcon(this)"><i data-lucide="sandwich" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="shrimp" onclick="window.pickCategoryIcon(this)"><i data-lucide="shrimp" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="soup" onclick="window.pickCategoryIcon(this)"><i data-lucide="soup" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="utensils" onclick="window.pickCategoryIcon(this)"><i data-lucide="utensils" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="wheat" onclick="window.pickCategoryIcon(this)"><i data-lucide="wheat" style="width:14px;"></i></button>
                            <button type="button" class="icon-pick-btn" data-icon="wine" onclick="window.pickCategoryIcon(this)"><i data-lucide="wine" style="width:14px;"></i></button>
                        </div>
                    </section>
                </div>
            </section>
        `;
    }

    async onMount() {
        if(window.lucide) {
            window.lucide.createIcons({
                root: this.element
            });
        }
    }
}
