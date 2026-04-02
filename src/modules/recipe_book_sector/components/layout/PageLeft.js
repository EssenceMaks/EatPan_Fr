import Component from '../../../../core/Component.js';

export default class PageLeft extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeBook: 'all', // 'all', 'my', 'guests', 'places'
            viewMode: 'grid',  // 'grid', 'list'
            activeCategory: 'all', // icon key or 'all'
            maxRibbonRows: 9, // dynamically updated based on screen height
            ribbonAvailableHeight: 420 // updated by ResizeObserver
        };

        // Expose state mutator so inline HTML string clicks can update state
        window.setPageLeftState = (newState) => {
            this.state = { ...this.state, ...newState };
            this.update(this.props);
        };

        window.openCategoryModal = () => {
            const bodyModal = document.body.querySelector(':scope > #catModalOverlay');
            const componentModal = document.querySelector('.page--left #catModalOverlay');

            if (componentModal) {
                // Fresh modal from re-render — remove stale body one, use fresh
                if (bodyModal) bodyModal.remove();
                document.body.appendChild(componentModal);
                componentModal.style.display = 'flex';
                if (window.lucide) window.lucide.createIcons({ root: componentModal });
            } else if (bodyModal) {
                // No re-render happened — reuse hidden body modal
                bodyModal.style.display = 'flex';
            }
            // Activate list tab when modal is open
            const listTab = document.querySelector('.side-tab--list-all');
            if (listTab) listTab.classList.add('active');
        };
        window.closeCategoryModal = () => {
            const overlay = document.getElementById('catModalOverlay');
            if (overlay) overlay.style.display = 'none';
            // Deactivate list tab when modal closes
            const listTab = document.querySelector('.side-tab--list-all');
            if (listTab) listTab.classList.remove('active');
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
        if (!this.props.recipes) return [];

        // Handle BOTH legacy hardcoded activeBooks ('my', 'guests', etc) AND exact dynamically mapped strings!
        const bookNameBase = {
            'all': 'Всі рецепти',
            'my': 'Особисті',
            'guests': 'Гості',
            'places': 'Заклади'
        }[this.state.activeBook];
        const bookName = bookNameBase || this.state.activeBook;

        let filtered = (this.props.recipes || []).filter(r => {
            if (this.state.activeBook === 'all') return true;
            return r.data && r.data.books && r.data.books.includes(bookName);
        });

        if (this.state.activeCategory !== 'all') {
            // Because activeCategory is built from `buildHierarchy` mainGroup labels (e.g. "М'ясні страви" instead of "М'ясо")
            // we must apply the SAME remapping here while filtering recipes!
            filtered = filtered.filter(r => {
                let cat = r.data && r.data.category ? r.data.category : 'Без категорії';
                let mainGroup = cat; // Default
                if (cat === "М'ясо") { mainGroup = "М'ясні страви"; }
                if (cat === "Птиця") { mainGroup = "М'ясні страви"; }
                if (cat === "Паста" || cat === "Салати") { mainGroup = "Гарніри"; }

                return mainGroup === this.state.activeCategory;
            });
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

        const isSingleCategory = Object.keys(hierarchy).length === 1;

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
                            <div style="display:${isSingleCategory ? 'block' : 'none'}; padding-left:15px; margin-top:5px;">
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
                            <i data-lucide="${window.getMainGroupIconDef ? window.getMainGroupIconDef(mainGroupName) : 'utensils'}" style="width:20px; color:var(--brand-red);"></i>
                            ${mainGroupName}
                        </div>
                        <i data-lucide="chevron-down" style="width:16px;"></i>
                    </div>
                    <div style="display:${isSingleCategory ? 'block' : 'none'}; padding-top:10px;">
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

            const catCounts = {};
            (this.props.recipes || []).forEach(r => {
                const c = r.data && r.data.category ? r.data.category : "Без категорії";
                catCounts[c] = (catCounts[c] || 0) + 1;
            });

            const getRecipeWord = (num) => {
                const lastDigit = num % 10;
                const lastTwoDigits = num % 100;
                if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'рецептів';
                if (lastDigit === 1) return 'рецепт';
                if (lastDigit >= 2 && lastDigit <= 4) return 'рецепти';
                return 'рецептів';
            };

            const existingCats = new Set(recipes.map(r => r.data && r.data.category ? r.data.category : "Без категорії"));

            const cards = Array.from(existingCats).map(cat => {
                const img = catImgs[cat] || catImgs["Супи"]; // fallback
                const count = catCounts[cat] || 0;
                const countText = `${count} ${getRecipeWord(count)}`;
                return `
                    <div class="category-card" onclick="window.setPageLeftState({ activeCategory: '${cat.replace(/'/g, "\\'")}', viewMode: 'list' })">
                        <div class="category-card-badge">${countText}</div>
                        <img alt="${cat}" class="category-card-img" src="${img}" />
                        <div class="category-card-pill" style="text-transform:uppercase;">${cat}</div>
                    </div>
                `;
            });

            return `
                <div class="category-cards-grid" style="padding: 0.7rem;">
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
                    <div class="category-card-badge"><i data-lucide="heart" style="width: 10px; margin-right: 3px; display:inline-block; vertical-align:middle;"></i> <span style="vertical-align:middle;">${r.likes || Math.floor(Math.random() * 15 + 1)}</span></div>
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
                <div class="category-cards-grid recipe-cards-grid">
                    ${recCards}
                </div>
            `;
        }
    }

    template() {
        window.getMainGroupIconDef = (name) => {
            const lower = name.toLowerCase();
            if (lower.includes('м\'яс') || lower.includes('beef') || lower.includes('lamb') || lower.includes('pork')) return 'beef';
            if (lower.includes('суп') || lower.includes('soup')) return 'soup';
            if (lower.includes('гарнір') || lower.includes('випіч') || lower.includes('wheat') || lower.includes('rice') || lower.includes('pasta')) return 'wheat';
            if (lower.includes('риба') || lower.includes('море') || lower.includes('fish') || lower.includes('shrimp')) return 'fish';
            if (lower.includes('десерт') || lower.includes('cake') || lower.includes('dessert')) return 'cake-slice';
            if (lower.includes('напій') || lower.includes('coffee') || lower.includes('drink')) return 'coffee';
            if (lower.includes('пт') || lower.includes('chicken') || lower.includes('turkey')) return 'drumstick';
            if (lower.includes('салат') || lower.includes('veg') || lower.includes('leaf')) return 'leaf';
            if (lower.includes('паста') || lower.includes('macaroni')) return 'utensils';
            return "utensils";
        };

        const book = this.state.activeBook;
        const view = this.state.viewMode;
        const cat = this.state.activeCategory;

        // Data logic
        const activeRecipesForView = this.getFilteredRecipes();
        let hierarchyForList = this.buildHierarchy(activeRecipesForView);
        if (view === 'list' && cat !== 'all') {
            hierarchyForList = { [cat]: hierarchyForList[cat] || {} };
        }

        const recipesInCurrentBook = (this.props.recipes || []).filter(r => {
            if (book === 'all') return true;
            return r.data && r.data.books && r.data.books.includes(book);
        });

        const bookHier = this.buildHierarchy(recipesInCurrentBook);
        const allCats = Object.keys(bookHier).filter(c => c !== 'Без категорії').sort();

        const uniqueGroupsSet = new Set(['Особисті', 'Гості', 'Заклади']);
        (this.props.recipes || []).forEach(r => {
            if (r.data && Array.isArray(r.data.books)) {
                r.data.books.forEach(b => {
                    if (b !== 'Всі рецепти' && b.trim() !== '') {
                        uniqueGroupsSet.add(b);
                    }
                });
            }
        });
        const dynamicGroups = Array.from(uniqueGroupsSet);

        const viewContentHTML = view === 'list'
            ? `<div class="categories-list-view" style="padding-top:10px;">${this.renderListView(hierarchyForList)}</div>`
            : this.renderGridView(activeRecipesForView);

        const catNameStr = cat !== 'all' ? cat.toUpperCase() : '';

        // Ribbons Grid Calculation
        const healthTabsDef = [
            { id: 'fruct', title: 'Фрукти', icon: 'banana', color: '' },
            { id: 'bads', title: 'Бади', icon: 'pill', color: '' },
            { id: 'first-aid', title: 'Аптечка', icon: 'circle-plus', color: 'var(--brand-red)' },
            { id: 'allergens', title: 'Алергени', icon: 'alert-triangle', color: 'var(--brand-red)' },
            { id: 'e-additives', title: 'Е-Добавки', icon: '', color: 'var(--brand-red)', textLabel: 'E' }
        ];

        const MAX_RIBBON_COLS = 2;
        const BASE_ROW_H = 35;
        const BASE_ROW_GAP = 6;
        const MIN_ROW_H = 24;
        const MIN_ROW_GAP = 4;

        // Dynamically add visual spacers only if we have room
        if ((this.state.maxRibbonRows || 9) >= 6) {
            healthTabsDef.unshift({ invisible: true });
        }
        if ((this.state.maxRibbonRows || 9) >= 7 && window.innerHeight >= 700) {
            healthTabsDef.push({ invisible: true });
        }

        let healthTabsLen = healthTabsDef.length;

        // Available pixel height for the ribbons grid
        const ribbonAvailH = this.state.ribbonAvailableHeight || 420;

        // Start with base sizes
        let rowH = BASE_ROW_H;
        let rowGap = BASE_ROW_GAP;
        let maxRows = Math.floor((ribbonAvailH + rowGap) / (rowH + rowGap));
        if (maxRows < 5) maxRows = 5;

        // Slots available for category tabs (rightmost col shares with health tabs)
        let rightmostCatSlots = maxRows - healthTabsLen;
        if (rightmostCatSlots < 0) rightmostCatSlots = 0;

        // Always reserve 1 slot for the "show all" list tab
        let requiredCols = 1;
        let catCountWithListTab = allCats.length + 1; // +1 for list tab
        let cLeft = catCountWithListTab - rightmostCatSlots;
        while (cLeft > 0 && requiredCols < MAX_RIBBON_COLS) {
            requiredCols++;
            cLeft -= maxRows;
        }

        // Total slots available across capped columns
        let totalSlots = rightmostCatSlots + (requiredCols - 1) * maxRows;

        // If categories + list tab don't fit at base size, shrink row height & gap
        if (catCountWithListTab > totalSlots) {
            const neededRows = Math.max(healthTabsLen, Math.ceil(catCountWithListTab / MAX_RIBBON_COLS) + healthTabsLen);
            rowGap = MIN_ROW_GAP;
            rowH = Math.floor((ribbonAvailH - (neededRows - 1) * rowGap) / neededRows);
            if (rowH < MIN_ROW_H) rowH = MIN_ROW_H;
            maxRows = Math.floor((ribbonAvailH + rowGap) / (rowH + rowGap));
            if (maxRows < neededRows) maxRows = neededRows;
            rightmostCatSlots = maxRows - healthTabsLen;
            if (rightmostCatSlots < 0) rightmostCatSlots = 0;
            totalSlots = rightmostCatSlots + (requiredCols - 1) * maxRows;
        }

        // Visible cats: reserve 1 slot for list tab; hide overflow
        const visibleCatLimit = totalSlots - 1; // -1 for list tab
        let visibleCats = allCats.slice(0, visibleCatLimit);
        const hiddenCats = allCats.slice(visibleCatLimit);

        // If active category is hidden, swap it in (replaces last visible cat)
        const activeIsHidden = cat !== 'all' && hiddenCats.includes(cat);
        if (activeIsHidden && visibleCats.length > 0) {
            visibleCats[visibleCats.length - 1] = cat;
        } else if (activeIsHidden) {
            visibleCats = [cat];
        }

        // Place visible category ribbons into grid positions
        let targetCol = requiredCols;
        let targetRow = 1;
        let renderedRibbons = [];
        let activeCols = new Set([requiredCols]);

        visibleCats.forEach(c => {
            if (targetCol === requiredCols && targetRow > rightmostCatSlots) {
                targetCol--;
                targetRow = 1;
                activeCols.add(targetCol);
            } else if (targetCol < requiredCols && targetRow > maxRows) {
                targetCol--;
                targetRow = 1;
                activeCols.add(targetCol);
            }
            if (targetCol < 1) targetCol = 1;
            renderedRibbons.push({ type: 'cat', name: c, col: targetCol, row: targetRow });
            targetRow++;
            activeCols.add(targetCol);
        });

        // Always place "show all" list tab after visible cats
        if (targetCol === requiredCols && targetRow > rightmostCatSlots) {
            targetCol--;
            targetRow = 1;
            activeCols.add(targetCol);
        } else if (targetCol < requiredCols && targetRow > maxRows) {
            targetCol--;
            targetRow = 1;
            activeCols.add(targetCol);
        }
        if (targetCol < 1) targetCol = 1;
        const listTabHTML = `
            <div class="side-tab--left side-tab--list-all" style="grid-column: ${targetCol}; grid-row: ${targetRow}; height: ${rowH}px;" title="Усі категорії" onclick="window.openCategoryModal()">
                <i data-lucide="list" style="width: ${rowH <= 26 ? 14 : 18}px;"></i>
            </div>`;
        activeCols.add(targetCol);

        // Generate background sheets for each active column
        const bgSheetsHTML = Array.from(activeCols).map(col => `
            <div class="side-tabs-bg-sheet" style="grid-column: ${col}; grid-row: 1 / -1;"></div>
        `).join('');

        const coverPadding = requiredCols * 55 + (requiredCols - 1) * 15 + 40;
        const bookCover = document.querySelector('.book-cover');
        if (bookCover) {
            bookCover.style.paddingLeft = `${coverPadding}px`;
        }

        const iconSize = rowH <= 26 ? 14 : 18;

        const healthTabsHTML = healthTabsDef.map((ht, idx) => {
            if (ht.invisible) return '';
            const content = ht.textLabel
                ? `<span class="side-tab-text-label" style="width: ${iconSize}px; height: ${iconSize}px; font-size: ${iconSize}px; ${ht.color ? `color: ${ht.color};` : ''}">${ht.textLabel}</span>`
                : `<i data-lucide="${ht.icon}" style="width: ${iconSize}px; ${ht.color ? `color: ${ht.color};` : ''}"></i>`;
            return `
            <div class="side-tab--left side-tab--no-content" title="${ht.title}" style="grid-column: ${requiredCols}; grid-row: ${(maxRows - healthTabsLen + 1) + idx}; height: ${rowH}px;">
                ${content}
            </div>
            `;
        }).join('');

        const ribbonsHTML = renderedRibbons.map((rib, i) => {
            const isActive = cat === rib.name;
            const clickAction = isActive
                ? "window.setPageLeftState({ activeCategory: 'all', viewMode: 'grid' })"
                : `window.setPageLeftState({ activeCategory: '${rib.name.replace(/'/g, "\\\'")}', viewMode: 'list' })`;
            return `
                <div class="side-tab--left ${isActive ? 'active' : ''}" style="grid-column: ${rib.col}; grid-row: ${rib.row}; height: ${rowH}px;" title="${rib.name}" onclick="${clickAction}">
                    <i data-lucide="${window.getMainGroupIconDef ? window.getMainGroupIconDef(rib.name) : 'utensils'}" style="width: ${iconSize}px;"></i>
                </div>`;
        }).join('');

        // Modal with all categories + health tabs (icon + text name)
        const getIcon = (name) => window.getMainGroupIconDef ? window.getMainGroupIconDef(name) : 'utensils';
        const visibleHealthTabs = healthTabsDef.filter(h => !h.invisible);
        const categoryModalHTML = `
            <div class="cat-modal-overlay" id="catModalOverlay" style="display:none;" onclick="window.closeCategoryModal()">
                <div class="cat-modal" onclick="event.stopPropagation()">
                    <div class="cat-modal-header">
                        <h3 style="margin:0; font-family: var(--font-serif); color: var(--ink);">Усі категорії</h3>
                        <button class="cat-modal-close" onclick="window.closeCategoryModal()" title="Закрити">
                            <i data-lucide="x" style="width:18px; height:18px;"></i>
                        </button>
                    </div>
                    <ul class="cat-modal-list">
                        ${allCats.map(c => `
                            <li class="cat-modal-item ${cat === c ? 'cat-modal-item--active' : ''}" onclick="window.closeCategoryModal(); window.setPageLeftState({ activeCategory: '${c.replace(/'/g, "\\'")}', viewMode: 'list' })">
                                <i data-lucide="${getIcon(c)}" style="width:20px; height:20px; flex-shrink:0;"></i>
                                <span>${c}</span>
                            </li>
                        `).join('')}
                        <li class="cat-modal-subheading">Здоров'я</li>
                        ${visibleHealthTabs.map(ht => `
                            <li class="cat-modal-item cat-modal-item--health">
                                ${ht.textLabel
                                    ? `<span style="width:20px; height:20px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; ${ht.color ? `color: ${ht.color};` : ''}">${ht.textLabel}</span>`
                                    : `<i data-lucide="${ht.icon}" style="width:20px; height:20px; flex-shrink:0; ${ht.color ? `color: ${ht.color};` : ''}"></i>`}
                                <span>${ht.title}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>`;

        return `
            <section class="page page--left page--left-grid-layout" style="--dynamic-book-padding: ${coverPadding}px;">
                <!-- Inner Header Tabs (Groups) -->
                <div class="grid-groups">
                    <div class="mobile-main-title">
                        <h1 class="text-h1 uppercase">ВСІ РЕЦЕПТИ</h1>
                        <p class="text-subtitle">Discover a limitless world of culinary possibilities...</p>
                    </div>
                    <header class="inner-tabs-header">
                        <div class="inner-tabs-group" style="display:flex; flex-wrap:wrap; gap: 4px; align-items:center;">
                            <button class="tab-btn--top ${book === 'all' ? 'active' : ''}" onclick="window.setPageLeftState({ activeBook: 'all' })">Всі рецепти</button>
                            ${dynamicGroups.map(g => {
            const customStyle = !['Особисті', 'Гості', 'Заклади'].includes(g) ? 'font-style: italic; color: var(--accent);' : '';
            return `
                                    <div class="group-tab-wrap" style="position:relative; display:inline-flex; align-items:center;" onmouseover="this.querySelector('.grp-actions').style.display='flex'" onmouseout="this.querySelector('.grp-actions').style.display='none'">
                                        <button class="tab-btn--top ${book === g ? 'active' : ''}" style="${customStyle}" onclick="window.setPageLeftState({ activeBook: '${g.replace(/'/g, "\\'")}' })">${g}</button>
                                        <div class="grp-actions" style="display:none; position:absolute; top:-12px; right:-10px; gap:2px; background:var(--parchment); border-radius:4px; border:1px solid rgba(0,0,0,0.1); padding:2px;">
                                            <i data-lucide="edit-2" style="width:12px; height:12px; cursor:pointer; color:var(--ink);" onclick="window.renameRecipeGroup('${g.replace(/'/g, "\\'")}')" title="Перейменувати"></i>
                                            <i data-lucide="trash-2" style="width:12px; height:12px; cursor:pointer; color:var(--brand-red);" onclick="window.deleteRecipeGroup('${g.replace(/'/g, "\\'")}')" title="Видалити"></i>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                        <div>
                            <button class="tab-btn--top" onclick="window.toggleCreateRecipe()"><i data-lucide="plus" style="width: 14px; height: 14px;"></i></button>
                        </div>
                    </header>
                </div>

                <div class="grid-filter">
                   <!-- Filter reserved area, currently empty in UI -->
                </div>

                <!-- LEFT SIDE RIBBONS GRID -->
                <aside class="side-tabs-grid grid-side_ribbons">
                    <div class="side-tabs-bg-wrapper" style="position: absolute; right: -8px; top: -1.5rem; bottom: -2.5rem; display: grid; grid-template-columns: repeat(${requiredCols}, 55px); column-gap: 5px; direction: rtl; justify-content: end;">
                        ${bgSheetsHTML}
                    </div>
                    <div class="side-tabs-grid-inner" style="grid-template-columns: repeat(${requiredCols}, 55px); grid-template-rows: repeat(${maxRows}, ${rowH}px); gap: ${rowGap}px 15px;">
                        ${ribbonsHTML}
                        ${listTabHTML}
                        ${healthTabsHTML}
                    </div>
                </aside>

                <div class="grid-categories">
                    <div class="categories-header-wrap" style="padding: 0 2.5rem; margin-top: 2rem;">
                        <div>
                            ${cat !== 'all' ? `
                            <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 5px; cursor: pointer; color: var(--brand-red); font-weight: bold; font-family: var(--font-serif); font-size: 14px;" onclick="window.setPageLeftState({activeCategory: 'all', viewMode: 'grid'})">
                                <i data-lucide="arrow-left" style="width:16px;"></i> КАТЕГОРІЇ
                            </div>
                            ` : ''}
                            <h1 class="text-h1">${cat === 'all' && view === 'grid' ? "CATEGORIES" : (cat !== 'all' ? "КАТЕГОРІЯ " + catNameStr : "СПИСОК РЕЦЕПТІВ")}</h1>
                            <p class="text-subtitle">Discover a limitless world of culinary possibilities...</p>
                        </div>
                        <div class="category-header-actions">
                            <button class="btn-action--tactile ${view === 'grid' ? 'active' : ''}" onclick="window.setPageLeftState({ viewMode: 'grid' })" title="Show Grid View"><i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i></button>
                            <button class="btn-action--tactile ${view === 'list' ? 'active' : ''}" onclick="window.setPageLeftState({ viewMode: 'list' })" title="Show List View"><i data-lucide="list" style="width: 16px; height: 16px;"></i></button>
                        </div>
                    </div>
                    
                    <!-- MOBILE HORIZONTAL TABS (Hidden on Desktop) -->
                    <div class="mobile-top-tabs-container" style="padding: 0 2.5rem;">
                        ${cat !== 'all' ? `
                        <div class="mobile-tab-item active" onclick="window.setPageLeftState({ activeCategory: 'all', viewMode: 'grid' })">
                            <div class="mobile-tab-icon" style="color: var(--brand-red);"><i data-lucide="x" style="width:20px; height:20px;"></i></div>
                            <span class="mobile-tab-label">Скинути</span>
                        </div>` : ''}

                        ${allCats.map(c => `
                            <div class="mobile-tab-item ${cat === c ? 'active' : ''}" onclick="window.setPageLeftState({ activeCategory: '${c.replace(/'/g, "\\'")}', viewMode: 'list' })">
                                <div class="mobile-tab-icon">
                                    <i data-lucide="${window.getMainGroupIconDef ? window.getMainGroupIconDef(c) : 'utensils'}" style="width:20px; height:20px;"></i>
                                </div>
                                <span class="mobile-tab-label">${c}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Scrollable Content -->
                <div class="scrollable-area page-content-wrapper grid-content" style="${view === 'grid' ? 'overflow-y: hidden;' : ''}">
                    <div class="categories-grid-view" style="padding: 0.7rem; ${view === 'grid' ? 'position: absolute; inset: 0;' : 'flex: none; height: auto;'}">
                        <!-- MAIN CONTENT LIST OR GRID -->
                        ${viewContentHTML}
                    </div>
                </div>

                <!-- LEFT BOTTOM RIBBONS -->
                <div class="bookmark-bottom-group-left grid-bottom_ribbons">
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
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px;">
                            <h3 class="section-title" style="margin-bottom:0;">Група рецептів</h3>
                        </div>
                        <div class="create-checklist" id="create-group-checklist" style="display:flex; flex-wrap:wrap; gap:10px;">
                            <label class="create-check-item"><input type="checkbox" name="book" value="Всі рецепти" checked> <span>Всі рецепти</span></label>
                            ${dynamicGroups.map(g => `<label class="create-check-item"><input type="checkbox" name="book" value="${g}"> <span>${g}</span></label>`).join('')}
                            
                            <div id="new-group-container" style="display:flex; align-items:center; height: 24px;">
                                <input type="text" id="new-group-input" placeholder="Нова група..." style="border: 1px dashed var(--brand-red); border-right: none; border-radius: 12px 0 0 12px; padding: 2px 8px; width: 100px; font-size:12px; height:100%; outline:none; background:none; color: var(--text-main);">
                                <button type="button" onclick="window.addCustomGroupInline()" title="Створити групу" style="background:var(--brand-red); border:1px solid var(--brand-red); border-radius: 0 12px 12px 0; cursor:pointer; height:100%; color:#fff; display:flex; align-items:center; justify-content:center; padding: 0 8px;"><i data-lucide="check" style="width:14px; height:14px;"></i></button>
                            </div>
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
                ${categoryModalHTML}
            </section>
        `;
    }

    async onMount() {
        if (window.lucide) {
            window.lucide.createIcons({
                root: this.element
            });
        }

        this.setupGridPulse();

        // Enable horizontal scrolling via vertical mouse wheel in grid containers
        const grids = this.element.querySelectorAll('.category-cards-grid');
        grids.forEach(grid => {
            grid.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) > 0) {
                    e.preventDefault();
                    grid.scrollLeft += e.deltaY;
                }
            }, { passive: false });

            grid.addEventListener('mouseenter', () => { this.isHoveringGrid = true; });
            grid.addEventListener('mouseleave', () => {
                this.isHoveringGrid = false;
                const activeCards = this.element.querySelectorAll('.category-card.pulse-active');
                activeCards.forEach(c => c.classList.remove('pulse-active'));
            });
        });

        // Measure available ribbon height and pass it to template for dynamic row sizing
        this.heightObserver = new ResizeObserver(() => {
            const ribbonsContainer = this.element.querySelector('.side-tabs-grid');
            const liveInner = this.element.querySelector('.side-tabs-grid-inner');
            if (ribbonsContainer && liveInner) {
                const topMargin = 0;
                liveInner.style.top = `${topMargin}px`;

                const availableHeight = ribbonsContainer.clientHeight - topMargin - 10;
                let newMaxRows = Math.floor((availableHeight + 8) / 43);
                if (newMaxRows < 5) newMaxRows = 5;

                const changed = this.state.maxRibbonRows !== newMaxRows
                    || this.state.ribbonAvailableHeight !== availableHeight;
                if (changed) {
                    this.state.maxRibbonRows = newMaxRows;
                    this.state.ribbonAvailableHeight = availableHeight;
                    this.update(this.props);
                }
            }
        });
        this.heightObserver.observe(this.element);
    }

    setupGridPulse() {
        if (this.pulseInterval) clearInterval(this.pulseInterval);
        if (this.pulseObserver) this.pulseObserver.disconnect();

        let visibleCards = [];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target;
                if (entry.isIntersecting) {
                    if (!visibleCards.includes(target)) {
                        visibleCards.push(target);
                    }
                } else {
                    visibleCards = visibleCards.filter(c => c !== target);
                    target.classList.remove('pulse-active');
                }
            });
        }, { threshold: 0.6 });

        const cards = Array.from(this.element.querySelectorAll('.category-card:not(.category-card--all)'));
        if (cards.length === 0) return;

        cards.forEach(c => observer.observe(c));
        this.pulseObserver = observer;

        let currentPulseIdx = 0;

        this.pulseInterval = setInterval(() => {
            if (this.isHoveringGrid) return;
            if (visibleCards.length === 0) return;

            // Note: we let animations run independently so we don't clear the old one manually,
            // but to be safe we just clean all visible cards that shouldn't be active right now.
            // Since our timeout removes active class, we just proceed.

            if (currentPulseIdx >= visibleCards.length) {
                currentPulseIdx = 0;
            }

            const targetCard = visibleCards[currentPulseIdx];
            if (targetCard) {
                targetCard.classList.add('pulse-active');
                setTimeout(() => {
                    if (targetCard) targetCard.classList.remove('pulse-active');
                }, 2000); // 2 second pulse duration
            }
            currentPulseIdx++;
        }, 3500); // Trigger every 3.5 seconds
    }

    onUnmount() {
        if (this.heightObserver) this.heightObserver.disconnect();
        if (this.pulseObserver) this.pulseObserver.disconnect();
        if (this.pulseInterval) clearInterval(this.pulseInterval);
        super.onUnmount && super.onUnmount();
    }
}
