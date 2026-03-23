import Component from '../../../../core/Component.js';

export default class PageLeft extends Component {
    template() {
        return `
            <section class="page page--left">
                <div class="mobile-main-title">
                    <h1 class="text-h1 uppercase">ВСІ РЕЦЕПТИ</h1>
                    <p class="text-subtitle">Discover a limitless world of culinary possibilities...</p>
                </div>
                <!-- Inner Header Tabs -->
                <header class="inner-tabs-header">
                    <div class="inner-tabs-group">
                        <button class="tab-btn--top active" id="chap-all-icon"
                            onclick="document.getElementById('filter-menu').classList.toggle('show')">
                            <i data-lucide="filter" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="tab-btn--top active" id="chap-all" onclick="setChapter('all')">Всі
                            рецепти</button>
                        <button class="tab-btn--top" id="chap-my" onclick="setChapter('my')">Особисті</button>
                        <button class="tab-btn--top" id="chap-guests" onclick="setChapter('guests')">Гості</button>
                        <button class="tab-btn--top" id="chap-places" onclick="setChapter('places')">Заклади</button>
                    </div>
                    <div>
                        <button class="tab-btn--top"><i data-lucide="plus" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </header>
                <!-- FILTER MENU -->
                <div class="filter-menu" id="filter-menu">
                    <label class="filter-radio-label">
                        <input type="radio" name="ing_filter" value="all" checked> Всі інгредієнти
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="ing_filter" value="available"> В наявності
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="ing_filter" value="to_buy"> Потрібно закупити
                    </label>
                </div>
                <!-- LEFT SIDE CATEGORY TABS -->
                <aside class="side-tabs-container side-tabs--left-top" id="side-tabs-categories">
                    <div class="side-tab--left" onclick="openCategory('soup')"><i data-lucide="soup" style="width: 18px;"></i></div>
                    <div class="side-tab--left active" onclick="openCategory('meat')"><i data-lucide="beef" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('main')"><i data-lucide="drumstick" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('fish')"><i data-lucide="fish" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('shrimp')"><i data-lucide="shrimp" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('pasta')"><i data-lucide="utensils" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('leaf')"><i data-lucide="leaf" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('wheat')"><i data-lucide="wheat" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('dessert')"><i data-lucide="cake-slice" style="width: 18px;"></i></div>
                    <div class="side-tab--left" onclick="openCategory('coffee')"><i data-lucide="coffee" style="width: 18px;"></i></div>
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
                                <h1 class="text-h1">CATEGORIES</h1>
                                <p class="text-subtitle">Discover a limitless world of culinary possibilities...</p>
                            </div>
                            <div class="category-header-actions">
                                <button class="btn-action--tactile" title="Toggle Grid/List View"><i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i></button>
                                <button class="btn-action--tactile" title="Create New Category"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></button>
                            </div>
                        </div>
                        <div class="category-cards-grid">
                            <div class="category-card" onclick="openCategory('meat')">
                                <img alt="Beef" class="category-card-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFQJX4a4czScihK-ImNo9rJk25Dadxma00W6aI8_EW2o4kSFlpqSqyPu82cyo4msu90zq2euVgVp7eRpfFITwHsXMANprRn3AQCMOUe_pzjZEA950_Oh7p6SQ9falr3Cej3ojb35QM3fDrxVVpQnvkAtwZBpfory0vZh2etpdnag3EfEuo7u_lrfBuHphba3ckh6Br_WmTqQK15ZQvaPZdEqssfo8QpWJcSgK_qKDYRAJpAYr3l4bzV85RXPifJRe_N15lVkzk9S2b" />
                                <div class="category-card-pill">Мясо</div>
                            </div>
                            <div class="category-card" onclick="openCategory('main')">
                                <img alt="Poultry" class="category-card-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ4p8i0GofuBpQqrlpOb3iYCoNFO9hPt_oaI4Q5t2S-ZonDtEQ2jT-ARspcHAwwDyUC0o1cNap9SyvwwoN9n9uyA7a0-13KoUpMkBk87AMZ5a0UnKa5XiA3RWjIOxVlOWeXpHRZ2l9LWmzVpMk3cje49GIZuUesm2bDgTk3GoRLMd9IGkjDXRVhn--AdovqTwnD39mPgJOaGH3y4-9pjhaZrLiDHxlaGwKQUGW3Ai-T5Cipj7hi2fkLmW-Zk2cjCEbX1sdzLZE-0V-" />
                                <div class="category-card-pill">Птица</div>
                            </div>
                            <div class="category-card" onclick="openCategory('pasta')">
                                <img alt="Pasta" class="category-card-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQmrfvgR4KaIXMFA7ntHy2Gz0DnWzWIjXcXRU8RmbPTtRelOa1zfZD7JZj_HrtOzcovTbia8ogFhYQI5IWUXYLE6yV0HQQJQlhEuTeCSH_x8ld0S_u_qzom5VbGJWTrcLWKITzcVg2O5mRkIIyzlGVhDSVEM3_qwuNQ3_NtWdJLAnDUXXxFYLjlIQefu6X8Dr1b0n9O7Hq-Rjbq1TO905pvIV8es1xQ-uIGd_OonIdQaENOZLRCT8N7J_6MgzVM20Jq6WDdpzdgYOK" />
                                <div class="category-card-pill">Паста</div>
                            </div>
                            <div class="category-card category-card--all">
                                <span>All Categories</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- LEFT BOTTOM RIBBONS (Book level filtering) -->
                <div class="bookmark-bottom-group-left">
                    <button class="bookmark-bottom-left fridge" onclick="this.classList.toggle('active')"><i data-lucide="refrigerator" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left ingredients" onclick="this.classList.toggle('active')"><i data-lucide="flask-conical" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left prepared has-items" onclick="this.classList.toggle('active')"><i data-lucide="soup" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left planned" onclick="this.classList.toggle('active')"><i data-lucide="timer" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom-left shopping active" onclick="this.classList.toggle('active')"><i data-lucide="shopping-basket" style="width: 25px; height: 25px;"></i></button>
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
                            <input type="text" placeholder="Нова категорія...">
                            <button class="create-new-cat-btn" type="button"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
                        </div>
                    </section>
                </div>
            </section>
        `;
    }
}
