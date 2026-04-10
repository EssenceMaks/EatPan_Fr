import Component from '../../core/Component.js';
import { RecipeService } from '../../core/ApiClient.js';
import RecipeBookLeftPage from './RecipeBookLeftPage.js';
import RecipeBookRightPage from './RecipeBookRightPage.js';
import RecipeBookSideRibbons from './RecipeBookSideRibbons.js';

const CATEGORY_ICON_MAP = {
  "М'ясні страви": 'drumstick',
  "М'ясо":        'drumstick',
  "Птиця":        'drumstick',
  "Гарніри":      'wheat',
  "Паста":        'utensils',
  "Салати":       'salad',
  "Риба":         'fish',
  "Морепродукти": 'fish',
  "Десерти":      'cake-slice',
  "Напої":        'coffee',
  "Супи":         'soup',
  "Випічка":      'croissant',
  "Сніданки":     'sunrise',
  "Закуски":      'sandwich',
};

function getCategoryIcon(name) {
  if (!name) return 'utensils';
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return 'utensils';
}

export default class RecipeBook extends Component {
  constructor(props = {}) {
    super(props);
    this.showingRight = false;
    this.activeCategory = null;
    this.recipes = [];
    this.categories = [];

    this.sideRibbons = null;

    this.leftPage = new RecipeBookLeftPage({
      onRecipeSelected: (id) => this.handleRecipeSelect(id),
      activeCategory: null,
      recipes: [],
    });
    
    this.rightPage = new RecipeBookRightPage({
      onBack: () => this.handleBack()
    });
  }

  async template() {
    return `
      <div class="rb-container">
        <div class="rb-wrapper" id="rb-wrapper">
          <div id="rb-ribbons-mount" class="rb-side-ribbons"></div>
          <div id="rb-left-mount" class="rb-side rb-left-side"></div>
          <div id="rb-right-mount" class="rb-side rb-right-side"></div>
        </div>
      </div>
    `;
  }

  async onMount() {
    // Mount left page and right page immediately with placeholder
    await this.leftPage.render(this.$('#rb-left-mount'), 'innerHTML');
    await this.rightPage.render(this.$('#rb-right-mount'), 'innerHTML');

    // Load recipes from API asynchronously
    this._loadRecipes();
    
    // Re-instantiate icons
    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }

    // Set up sub-state routing natively using popstate to handle Mobile Back button
    this._popStateHandler = (e) => {
      const state = e?.state;
      if (state && state.substate === 'recipe_detail') {
        this._showRightSide(state.recipeId);
      } else {
        this._hideRightSide();
      }
    };
    window.addEventListener('popstate', this._popStateHandler);

    this._setupSwipeToClose();
  }

  _setupSwipeToClose() {
    let startX = 0;
    let startY = 0;
    const wrapper = this.$('#rb-wrapper');
    if (!wrapper) return;

    wrapper.addEventListener('touchstart', (e) => {
      // Only record touch if the right side is visible (on mobile)
      if (!this.showingRight || window.innerWidth > 899) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      if (!this.showingRight || window.innerWidth > 899) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const dx = endX - startX;
      const dy = endY - startY;

      // Detect light swipe right (left-to-right)
      if (dx > 40 && Math.abs(dy) < 50) {
        this.handleBack();
      }
    }, { passive: true });
  }

  onDestroy() {
    if (this._popStateHandler) {
      window.removeEventListener('popstate', this._popStateHandler);
    }
  }

  async _loadRecipes() {
    console.log('📖 RecipeBook: loading recipes from API...');
    const data = await RecipeService.fetchAll();
    this.recipes = Array.isArray(data) ? data : [];
    console.log(`📖 RecipeBook: loaded ${this.recipes.length} recipes`);

    // Extract unique categories from loaded recipes
    const catSet = new Map();
    this.recipes.forEach(r => {
      const cat = r.data?.category || 'Без категорії';
      if (!catSet.has(cat)) {
        catSet.set(cat, { id: cat, label: cat, icon: getCategoryIcon(cat) });
      }
    });
    this.categories = Array.from(catSet.values()).sort((a, b) => a.label.localeCompare(b.label));

    // Create and mount side ribbons with real categories
    this.sideRibbons = new RecipeBookSideRibbons({
      categories: this.categories,
      healthTabs: [
        { id: 'fruits',     label: 'Фрукти',      icon: 'banana' },
        { id: 'supplements',label: 'Бади',          icon: 'pill' },
        { id: 'first-aid',  label: 'Аптечка',       icon: 'circle-plus', color: 'var(--crimson, #8b1a1a)' },
        { id: 'allergens',  label: 'Алергени',      icon: 'alert-triangle', color: 'var(--crimson, #8b1a1a)' },
        { id: 'e-additives',label: 'Е-Добавки',     textLabel: 'E', color: 'var(--crimson, #8b1a1a)' },
      ],
      activeId: null,
      onSelect: (catId) => this.handleCategorySelect(catId),
    });
    await this.sideRibbons.render(this.$('#rb-ribbons-mount'), 'innerHTML');

    // Update left page with real recipes
    this.leftPage.setRecipes(this.recipes);

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  handleCategorySelect(catId) {
    this.activeCategory = catId;
    this.leftPage.setActiveCategory(catId);
  }

  handleRecipeSelect(id) {
    const parentIndex = history.state?.index || '4'; // Maintain Sector Carousel state
    
    // Push our detailed state to browser history!
    history.pushState({ 
      type: 'block', 
      index: parentIndex, 
      substate: 'recipe_detail', 
      recipeId: id 
    }, null, '');

    this._showRightSide(id);
  }

  handleBack() {
    // Instead of forcing the UI back manually, pop the browser history
    history.back();
  }

  _showRightSide(id) {
    this.showingRight = true;
    const wrapper = this.$('#rb-wrapper');
    if (wrapper) wrapper.classList.add('mobile-show-right');
    this.rightPage.loadRecipe(id);
  }

  _hideRightSide() {
    this.showingRight = false;
    const wrapper = this.$('#rb-wrapper');
    if (wrapper) wrapper.classList.remove('mobile-show-right');
  }
}
