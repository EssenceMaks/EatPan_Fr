import Component from '../../../core/Component.js';

export default class RecipeCategoryList extends Component {
  constructor(props = {}) {
    super(props);
    this.hierarchy = props.hierarchy || {};
    this.allOpen = props.allOpen || false;
    this.onRecipeSelect = props.onRecipeSelect || (() => {});
  }

  async template() {
    if (Object.keys(this.hierarchy).length === 0) {
      return `
        <div class="book-page-scroll" style="display:flex;flex-direction:column;align-items:center;padding-top:40px;opacity:0.5;">
          <p style="font-family:var(--font-title,serif);font-style:italic;">Немає рецептів.</p>
        </div>
      `;
    }

    const contentHtml = Object.entries(this.hierarchy).sort(([a],[b]) => a.localeCompare(b)).map(([cat, list]) => `
      <div class="arc-list-group">
        <div class="arc-list-header ${this.allOpen ? 'open' : ''}" data-cat="${cat}">
          <span>${cat}</span>
          <div style="display:flex;align-items:center;">
            <span style="opacity:0.5;font-size:0.85rem;margin-right:12px;">${list.length}</span>
            <i data-lucide="chevron-down" class="arc-list-header-chevron" style="width:16px;height:16px;"></i>
          </div>
        </div>
        <div class="arc-list-items" style="display: ${this.allOpen ? 'grid' : 'none'};">
          ${list.map(r => `
            <div class="arc-list-item" data-id="${r.id}">
              <span class="arc-list-item-bullet">•</span>
              <span class="arc-list-item-text">${r.data?.title || 'Без назви'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    return `
      <div class="arc-list-container">
        ${contentHtml}
      </div>
    `;
  }

  async onMount() {
    this.$$('.arc-list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.onRecipeSelect(id);
      });
    });

    this.$$('.arc-list-header').forEach(h => {
      h.addEventListener('click', () => {
        const items = h.nextElementSibling;
        if (items) {
          const isOpen = items.style.display !== 'none';
          items.style.display = isOpen ? 'none' : 'grid';
          if (isOpen) h.classList.remove('open');
          else h.classList.add('open');
        }
      });
    });
  }

  updateData(hierarchy, allOpen) {
    this.hierarchy = hierarchy;
    if (allOpen !== undefined) this.allOpen = allOpen;
    this.update();
  }
}
