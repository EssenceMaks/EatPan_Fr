import Component from '../../../core/Component.js';
import RecipeGroups from './RecipeGroups.js';
import RecipeCategoryGrid from './RecipeCategoryGrid.js';
import RecipeCategoryList from './RecipeCategoryList.js';
import RecipeCardGrid from './RecipeCardGrid.js';

export default class RecipeBookLeftPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onRecipeSelected = props.onRecipeSelected || (() => { });
    this.onCategorySelected = props.onCategorySelected || null;

    // Internal state
    this.activeGroup = 'all';     // "Всі рецепти", "Особисті", etc.
    this.activeCategory = props.activeCategory || null; // e.g. "М'ясо", null means Grid View of categories
    this.viewMode = 'grid';       // 'grid' or 'list'
    this.listAllOpen = false;     // Toggle for expanding/collapsing all in list mode
    this.recipes = props.recipes || [];
    this.needsAuth = false;

    // Dynamic Pagination State
    this.paginatedRecipes = [];
    this.currentOffset = 0;
    this.hasMoreRecipes = true;
    this.isLoadingPage = false;

    // Subcomponents
    this.cmpGroups = new RecipeGroups({
      groups: [],
      activeGroup: this.activeGroup,
      onGroupSelect: (grp) => {
        this.activeGroup = grp;
        this.activeCategory = null;
        if (this.onCategorySelected) this.onCategorySelected(null);
        this.viewMode = 'grid';
        this.listAllOpen = false;
        
        // Reset pagination
        this.paginatedRecipes = [];
        this.currentOffset = 0;
        this.hasMoreRecipes = true;
        this.isLoadingPage = false;
        
        this.update();
      }
    });

    this.cmpCatGrid = new RecipeCategoryGrid({
      categories: [],
      recipeCounts: {},
      onSelectCategory: (cat) => {
        this.activeCategory = cat;
        if (this.onCategorySelected) this.onCategorySelected(cat);
        
        // Reset pagination
        this.paginatedRecipes = [];
        this.currentOffset = 0;
        this.hasMoreRecipes = true;
        this.isLoadingPage = false;
        
        // STAY in grid mode, but now it will render the RecipeCardGrid!
        this.update();
      }
    });

    this.cmpRecipeGrid = new RecipeCardGrid({
      recipes: [],
      onSelectRecipe: this.onRecipeSelected,
      onLoadMore: () => this._loadNextPage()
    });

    this.cmpList = new RecipeCategoryList({
      hierarchy: {},
      onRecipeSelect: this.onRecipeSelected
    });

    this.officialCategories = null; // To store official DB categories
    this._categoriesLoading = false; // Guard against infinite retry loop
    
    // Listen for category deletions/creations globally
    this._onCatsChanged = () => {
      this._categoriesLoading = false; // Allow reload on explicit event
      this._loadOfficialCategories();
    };
    window.addEventListener('eatpan-categories-changed', this._onCatsChanged);
  }

  destroy() {
    window.removeEventListener('eatpan-categories-changed', this._onCatsChanged);
    super.destroy();
  }

  _loadOfficialCategories() {
    // Prevent re-entry: if already loading or already loaded, skip
    if (this._categoriesLoading) return;
    this._categoriesLoading = true;

    import('../../../core/ApiClient.js').then(async ({ CategoryService }) => {
      try {
        const cats = await CategoryService.fetchAll();
        if (Array.isArray(cats)) {
          this.officialCategories = cats;
        } else {
          // API returned null/error — treat as empty, don't retry on next mount
          console.warn('Categories API returned non-array, using empty fallback');
          this.officialCategories = [];
        }
        this.update(); // re-render grid/list with new fallback grouping
      } catch (e) {
        console.error('Failed to load official categories', e);
        this.officialCategories = []; // Fallback to empty — prevents infinite retry
      } finally {
        this._categoriesLoading = false;
      }
    });
  }

  // Helper method: get groups array from recipes
  _getDynamicGroups() {
    const uniqueGroupsSet = new Set(['Особисті', 'Гості', 'Заклади']); // Default order / guarantees
    let hasUngrouped = false;
    (this.recipes || []).forEach(r => {
      if (r.data && Array.isArray(r.data.books) && r.data.books.length > 0) {
        r.data.books.forEach(b => {
          if (b !== 'Всі рецепти' && b.trim() !== '') {
            uniqueGroupsSet.add(b);
          }
        });
      } else {
        hasUngrouped = true;
      }
    });
    const arr = Array.from(uniqueGroupsSet);
    if (hasUngrouped) arr.push('Без групи');
    return arr;
  }

  // Filter recipes by currently active group
  _getGroupFilteredRecipes() {
    if (this.activeGroup === 'all') return this.recipes;
    if (this.activeGroup === 'Без групи') {
      return this.recipes.filter(r => !r.data || !Array.isArray(r.data.books) || r.data.books.length === 0);
    }
    return this.recipes.filter(r => {
      return r.data && Array.isArray(r.data.books) && r.data.books.includes(this.activeGroup);
    });
  }

  // Helper: get resolved categories for any recipe format
  _getRecipeCats(r) {
    let cats = [];
    
    if (r.category !== undefined) {
      // Lightweight recipe
      if (Array.isArray(r.category)) {
        cats = r.category;
      } else if (typeof r.category === 'string') {
        cats = r.category.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (r.data) {
      // Full recipe
      if (Array.isArray(r.data.categories) && r.data.categories.length > 0) {
        cats = r.data.categories;
      } else if (typeof r.data.category === 'string') {
        cats = r.data.category.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (cats.length === 0) cats = ['Без категорії'];

    const officialCatNames = (this.officialCategories || []).map(c => c.data?.name);
    const hasOfficialData = this.officialCategories && this.officialCategories.length > 0;

    return cats.map(cat => {
      if (hasOfficialData && cat !== 'Без категорії' && !officialCatNames.includes(cat)) {
        return 'Забуті категорії';
      }
      return cat;
    });
  }

  // Get categories and their counts for Grid View
  _getCategoriesData(filtered) {
    const counts = {};
    const officialCatNames = (this.officialCategories || []).map(c => c.data?.name);

    filtered.forEach(r => {
      const cats = this._getRecipeCats(r);
      for (const cat of cats) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    // Ensure all official categories are shown, even if 0 recipes are currently loaded locally
    for (const catName of officialCatNames) {
      if (!counts[catName]) counts[catName] = 0;
    }

    return {
      categories: Object.keys(counts).sort((a, b) => a.localeCompare(b)),
      recipeCounts: counts
    };
  }

  async _loadNextPage() {
    if (this.isLoadingPage || !this.hasMoreRecipes) return;
    this.isLoadingPage = true;
    
    this.cmpRecipeGrid.updateData(this.paginatedRecipes, this.hasMoreRecipes, true);
    
    // Slight delay for UX smoothness
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      const limit = 20;
      const startIndex = this.currentOffset;
      
      // Start with recipes filtered by the active group (Особисті, Всі рецепти, etc.)
      let relevant = this._getGroupFilteredRecipes();
      
      if (this.activeCategory) {
        relevant = relevant.filter(r => this._getRecipeCats(r).includes(this.activeCategory));
      }
      
      const newRecipes = relevant.slice(startIndex, startIndex + limit);
      
      this.paginatedRecipes = [...this.paginatedRecipes, ...newRecipes];
      this.currentOffset += newRecipes.length;
      
      if (this.currentOffset >= relevant.length || newRecipes.length === 0) {
        this.hasMoreRecipes = false;
      }
    } catch (e) {
      console.error('Failed to paginate recipes locally', e);
      this.hasMoreRecipes = false;
    } finally {
      this.isLoadingPage = false;
      this.cmpRecipeGrid.updateData(this.paginatedRecipes, this.hasMoreRecipes, false);
    }
  }

  // Get hierarchical data for List View
  _getListHierarchy(filtered) {
    const hierarchy = {};

    if (this.activeCategory) {
      // If a specific category is selected, ONLY return that category
      hierarchy[this.activeCategory] = [];
      const relevant = filtered.filter(r => this._getRecipeCats(r).includes(this.activeCategory));
      hierarchy[this.activeCategory] = relevant;
      return hierarchy;
    }

    const officialCatNames = (this.officialCategories || []).map(c => c.data?.name);

    // Only include official categories with fallback
    officialCatNames.forEach(name => hierarchy[name] = []);
    hierarchy['Забуті категорії'] = [];
    hierarchy['Без категорії'] = [];

    filtered.forEach(r => {
      const cats = this._getRecipeCats(r);
      for (const cat of cats) {
        if (!hierarchy[cat]) hierarchy[cat] = [];
        hierarchy[cat].push(r);
      }
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
                <h3 class="rb-title" style="font-size: 1.15rem;margin:0;text-transform:uppercase;">КАТЕГОРІЯ ${this.activeCategory}</h3>
              </div>
            ` : `
              <h3 class="rb-title" style="font-size: 1.15rem;">КАТЕГОРІЇ</h3>
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
    if (this.officialCategories === null) {
      this._loadOfficialCategories();
    }

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
          this.cmpCatGrid.updateData(gridData.categories, gridData.recipeCounts, this.officialCategories);
          await this.cmpCatGrid.render(cContainer);
        } else {
          // Category active: show dynamic paginated grid of ACTUAL RECIPES
          if (this.paginatedRecipes.length === 0 && this.hasMoreRecipes && !this.isLoadingPage) {
            this._loadNextPage(); // Start fetching
          } else {
            this.cmpRecipeGrid.updateData(this.paginatedRecipes, this.hasMoreRecipes, this.isLoadingPage);
          }
          await this.cmpRecipeGrid.render(cContainer);
        }
      } else {
        // List mode: either all categories as accordions, or just one category
        const hierarchy = this._getListHierarchy(filtered);
        const forceOpen = this.activeCategory ? true : this.listAllOpen;
        
        // Ensure cmpList exists before using it (it should be defined in constructor, but let's be safe)
        if (!this.cmpList) {
          const RecipeCategoryList = (await import('./RecipeCategoryList.js')).default;
          this.cmpList = new RecipeCategoryList({ hierarchy, allOpen: forceOpen, onRecipeSelect: this.onRecipeSelected });
        } else {
          this.cmpList.updateData(hierarchy, forceOpen);
        }
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
          if (this.activeCategory) {
            // If inside a specific category, exit it and expand all
            this.activeCategory = null;
            if (this.onCategorySelected) this.onCategorySelected(null);
            this.listAllOpen = true;
          } else {
            // Otherwise just toggle expand/collapse
            this.listAllOpen = !this.listAllOpen;
          }
        }

        this.update();
      });
    });

    // 4. Back button from specific category
    this.$$('.rb-back-to-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = null;
        if (this.onCategorySelected) this.onCategorySelected(null);
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
    
    // Reset pagination so that clicking a new ribbon triggers a fresh load
    this.paginatedRecipes = [];
    this.currentOffset = 0;
    this.hasMoreRecipes = true;
    this.isLoadingPage = false;
    
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
