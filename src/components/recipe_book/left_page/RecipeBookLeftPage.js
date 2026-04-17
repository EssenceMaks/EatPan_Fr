import Component from '../../../core/Component.js';
import RecipeGroups from './RecipeGroups.js';
import RecipeCategoryGrid from './RecipeCategoryGrid.js';
import RecipeCategoryList from './RecipeCategoryList.js';
import RecipeCardGrid from './RecipeCardGrid.js';

export default class RecipeBookLeftPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onRecipeSelected = props.onRecipeSelected || (() => {});
    
    // Internal state
    this.activeGroup = 'all';     // "Всі рецепти", "Особисті", etc.
    this.activeCategory = props.activeCategory || null; // e.g. "М'ясо", null means Grid View of categories
    this.viewMode = 'grid';       // 'grid' or 'list'
    this.listAllOpen = false;     // Toggle for expanding/collapsing all in list mode
    this.recipes = props.recipes || [];
    this.needsAuth = false;

    // Subcomponents
    this.cmpGroups = new RecipeGroups({
      groups: [],
      activeGroup: this.activeGroup,
      onGroupSelect: (grp) => {
        this.activeGroup = grp;
        this.activeCategory = null; 
        this.viewMode = 'grid';
        this.listAllOpen = false;
        this.update();
      }
    });

    this.cmpCatGrid = new RecipeCategoryGrid({
      categories: [],
      recipeCounts: {},
      onSelectCategory: (cat) => {
        this.activeCategory = cat;
        // STAY in grid mode, but now it will render the RecipeCardGrid!
        this.update();
      }
    });

    this.cmpRecipeGrid = new RecipeCardGrid({
      recipes: [],
      onSelectRecipe: this.onRecipeSelected
    });

    this.cmpList = new RecipeCategoryList({
      hierarchy: {},
      onRecipeSelect: this.onRecipeSelected
    });
  }

  // Helper method: get groups array from recipes
  _getDynamicGroups() {
    const uniqueGroupsSet = new Set(['Особисті', 'Гості', 'Заклади']); // Default order / guarantees
    (this.recipes || []).forEach(r => {
      if (r.data && Array.isArray(r.data.books)) {
        r.data.books.forEach(b => {
          if (b !== 'Всі рецепти' && b.trim() !== '') {
            uniqueGroupsSet.add(b);
          }
        });
      }
    });
    return Array.from(uniqueGroupsSet);
  }

  // Filter recipes by currently active group
  _getGroupFilteredRecipes() {
    if (this.activeGroup === 'all') return this.recipes;
    return this.recipes.filter(r => {
      return r.data && Array.isArray(r.data.books) && r.data.books.includes(this.activeGroup);
    });
  }

  // Get categories and their counts for Grid View
  _getCategoriesData(filtered) {
    const counts = {};
    filtered.forEach(r => {
      const cat = r.data?.category || 'Без категорії';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return {
      categories: Object.keys(counts).sort((a,b) => a.localeCompare(b)),
      recipeCounts: counts
    };
  }

  // Get hierarchical data for List View
  _getListHierarchy(filtered) {
    const hierarchy = {};
    const relevant = this.activeCategory 
        ? filtered.filter(r => (r.data?.category || 'Без категорії') === this.activeCategory)
        : filtered;

    relevant.forEach(r => {
      const cat = r.data?.category || 'Без категорії';
      if (!hierarchy[cat]) hierarchy[cat] = [];
      hierarchy[cat].push(r);
    });
    return hierarchy;
  }

  async template() {
    if (this.needsAuth) {
      return `
        <div class="book-page-container">
          <div class="book-page-header">
            <h2 class="rb-title">Книга рецептів</h2>
          </div>
          <div class="book-page-scroll" style="display:flex;flex-direction:column;align-items:center;padding-top:40px;opacity:0.7;">
            <i data-lucide="lock" style="width:48px;height:48px;margin-bottom:12px;"></i>
            <p style="font-family:var(--font-title,serif);font-size:1.1rem;margin-bottom:8px;">Потрібна авторизація</p>
            <p style="font-size:0.85rem;color:#666;">Натисніть на аватарку у хедері, щоб увійти через Google</p>
          </div>
        </div>
      `;
    }

    if (this.recipes.length === 0) {
      return `
        <div class="book-page-container">
          <div class="book-page-header">
            <h2 class="rb-title">Книга рецептів</h2>
          </div>
          <div class="book-page-scroll" style="display:flex;flex-direction:column;align-items:center;padding-top:40px;opacity:0.5;">
            <i data-lucide="loader" style="width:32px;height:32px;animation:spin 1s linear infinite;"></i>
            <p style="margin-top:12px;font-family:var(--font-title,serif);font-style:italic;">Завантаження рецептів...</p>
          </div>
        </div>
      `;
    }

    // Determine the header title
    const headerTitle = this.activeGroup === 'all' ? 'Всі рецепти' : this.activeGroup;

    return `
      <div class="book-page-container">
        <div class="book-page-header" style="justify-content: flex-start; padding-left: 32px; flex-shrink: 0;">
          <h2 class="rb-title">${headerTitle}</h2>
        </div>
        <div class="book-page-scroll" style="${this.viewMode === 'grid' ? 'overflow: hidden !important;' : ''} display:flex; flex-direction:column;">
          <div class="rb-groups-mount" style="flex-shrink:0;"></div>
          
          <div class="rb-categories-header-row" style="flex-shrink:0;">
            ${this.activeCategory ? `
              <div style="display:flex;align-items:center;gap:12px;">
                <button class="rb-back-to-cat-btn" style="background:transparent;border:none;color:var(--brand-red,#8b1a1a);font-family:var(--font-title,serif);font-weight:700;display:flex;align-items:center;gap:4px;cursor:pointer;padding:0;outline:none;">
                  <i data-lucide="arrow-left" style="width:16px;height:16px;"></i> 
                </button>
                <h3 class="rb-title" style="font-size: 1.25rem;margin:0;text-transform:uppercase;">КАТЕГОРІЯ ${this.activeCategory}</h3>
              </div>
            ` : `
              <h3 class="rb-title" style="font-size: 1.25rem;">КАТЕГОРІЇ</h3>
            `}
            <div class="rb-view-toggles">
              <button class="rb-view-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-mode="grid">
                <i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i>
              </button>
              <button class="rb-view-btn ${this.viewMode === 'list' && !this.listAllOpen ? 'active' : ''}" data-mode="list">
                <i data-lucide="list" style="width: 16px; height: 16px;"></i>
              </button>
              <button class="rb-view-btn ${this.viewMode === 'list' && this.listAllOpen ? 'active' : ''}" data-mode="list-expand" title="Розгорнути/Згорнути всі">
                <i data-lucide="list-tree" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          </div>

          <div class="rb-content-mount" style="flex:1; min-height:0; position:relative; ${this.viewMode === 'grid' ? 'overflow: hidden;' : ''}"></div>
        </div>
      </div>
    `;
  }

  async onMount() {
    // 1. Mount recipe groups
    const gContainer = this.$('.rb-groups-mount');
    if (gContainer) {
      this.cmpGroups.updateData(this._getDynamicGroups(), this.activeGroup);
      await this.cmpGroups.render(gContainer);
    }

    // 2. Mount specific view mode content
    const cContainer = this.$('.rb-content-mount');
    if (cContainer) {
      const filtered = this._getGroupFilteredRecipes();
      
      if (this.viewMode === 'grid') {
        if (!this.activeCategory) {
          // No category active: show tiles of Categories
          const gridData = this._getCategoriesData(filtered);
          this.cmpCatGrid.updateData(gridData.categories, gridData.recipeCounts);
          await this.cmpCatGrid.render(cContainer);
        } else {
          // Category active: show grid of ACTUAL RECIPES
          const specificRecipes = filtered.filter(r => (r.data?.category || 'Без категорії') === this.activeCategory);
          this.cmpRecipeGrid.updateData(specificRecipes);
          await this.cmpRecipeGrid.render(cContainer);
        }
      } else {
        // List mode: either all categories as accordions, or just one category
        const hierarchy = this._getListHierarchy(filtered);
        this.cmpList.updateData(hierarchy, this.listAllOpen);
        await this.cmpList.render(cContainer);
      }
    }

    // 3. Attach layout toggle listeners
    this.$$('.rb-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.getAttribute('data-mode');
        
        if (mode === 'grid') {
          this.viewMode = 'grid';
          this.listAllOpen = false;
        } else if (mode === 'list') {
          this.viewMode = 'list';
          this.listAllOpen = false;
        } else if (mode === 'list-expand') {
          this.viewMode = 'list';
          this.listAllOpen = !this.listAllOpen;
        }
        
        this.update();
      });
    });

    // 4. Back button from specific category
    this.$$('.rb-back-to-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = null;
        this.update();
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  // Expose setActiveCategory explicitly so Ribbons can trigger it!
  setActiveCategory(catId) {
    this.activeCategory = catId;
    this.viewMode = 'grid'; // Let it default to grid showing recipes now, per new UX logic!
    this.update();
  }

  setRecipes(recipes) {
    this.recipes = recipes || [];
    this.needsAuth = false;
    this.update();
  }

  setAuthMessage(needsAuth) {
    this.needsAuth = needsAuth;
    this.update();
  }
}
