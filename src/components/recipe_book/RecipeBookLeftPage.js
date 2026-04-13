import Component from '../../core/Component.js';

export default class RecipeBookLeftPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onRecipeSelected = props.onRecipeSelected || (() => {});
    this.activeCategory = props.activeCategory || null;
    this.recipes = props.recipes || [];
  }

  _getFilteredRecipes() {
    if (!this.activeCategory) return this.recipes;
    return this.recipes.filter(r => {
      const cat = r.data?.category || 'Без категорії';
      return cat === this.activeCategory;
    });
  }

  async template() {
    const filtered = this._getFilteredRecipes();
    const titleText = this.activeCategory || 'Усі рецепти';
    const countText = filtered.length > 0 ? `(${filtered.length})` : '';

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

    // Group by category
    const groups = {};
    filtered.forEach(r => {
      const cat = r.data?.category || 'Без категорії';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });

    let contentHtml = '';
    if (this.activeCategory) {
      // Show flat list for single category
      contentHtml = filtered.map(r => `
        <div class="rb-mock-item" data-id="${r.id}">
          <i data-lucide="chef-hat" style="width:18px;height:18px;margin-right:10px;opacity:0.5;flex-shrink:0;"></i>
          <span>${r.data?.title || 'Без назви'}</span>
        </div>
      `).join('');
    } else {
      // Show grouped list
      contentHtml = Object.entries(groups).sort(([a],[b]) => a.localeCompare(b)).map(([cat, list]) => `
        <div class="rb-category-group">
          <div class="rb-category-header" data-cat="${cat}">
            <span>${cat}</span>
            <span style="opacity:0.5;font-size:0.85rem;">${list.length}</span>
          </div>
          <div class="rb-category-items">
            ${list.map(r => `
              <div class="rb-mock-item" data-id="${r.id}">
                <span style="color:var(--crimson,#8b1a1a);margin-right:8px;">•</span>
                <span>${r.data?.title || 'Без назви'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    return `
      <div class="book-page-container">
        <div class="book-page-header">
          <h2 class="rb-title">${titleText} ${countText}</h2>
        </div>
        <div class="book-page-scroll">
          <div class="rb-mock-list">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    const items = this.$$('.rb-mock-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.onRecipeSelected(id);
      });
    });

    // Category header click toggles visibility
    const headers = this.$$('.rb-category-header');
    headers.forEach(h => {
      h.style.cursor = 'pointer';
      h.addEventListener('click', () => {
        const items = h.nextElementSibling;
        if (items) {
          items.style.display = items.style.display === 'none' ? 'grid' : 'none';
        }
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  setActiveCategory(catId) {
    this.activeCategory = catId;
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
