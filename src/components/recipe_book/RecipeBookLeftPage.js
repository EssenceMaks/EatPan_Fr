import Component from '../../core/Component.js';

const ALL_CATEGORIES = [
  { id: 'breakfast',  label: 'Breakfast & Brunch', icon: 'sunrise' },
  { id: 'main',       label: 'Main Courses',       icon: 'utensils' },
  { id: 'desserts',   label: 'Desserts',           icon: 'cake-slice' },
  { id: 'beverages',  label: 'Beverages',          icon: 'coffee' },
  { id: 'salads',     label: 'Salads',             icon: 'salad' },
  { id: 'soups',      label: 'Soups',              icon: 'soup' },
];

export default class RecipeBookLeftPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onRecipeSelected = props.onRecipeSelected || (() => {});
    this.activeCategory = props.activeCategory || null;
  }

  _getVisibleCategories() {
    if (!this.activeCategory) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter(c => c.id === this.activeCategory);
  }

  async template() {
    const cats = this._getVisibleCategories();
    const titleText = this.activeCategory
      ? (ALL_CATEGORIES.find(c => c.id === this.activeCategory)?.label || 'Category')
      : 'All Categories';

    const itemsHtml = cats.map(c => `
      <div class="rb-mock-item" data-id="${c.id}">
        <i data-lucide="${c.icon}" style="width:18px;height:18px;margin-right:10px;opacity:0.6;"></i>
        ${c.label}
      </div>
    `).join('');

    return `
      <div>
        <h2 class="rb-title">${titleText}</h2>
        <div class="rb-mock-list">
          ${itemsHtml}
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

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  setActiveCategory(catId) {
    this.activeCategory = catId;
    this.update();
  }
}
