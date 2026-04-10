import Component from '../../core/Component.js';

export default class RecipeOverview extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeData = props.recipeData || {};
    this.onMoreDetails = props.onMoreDetails || (() => {});
  }

  _getIngredientIcon(name) {
    if (!name) return 'utensils';
    const n = name.toLowerCase();
    if (n.includes('морков') || n.includes('carrot')) return 'carrot';
    if (n.includes('яйц') || n.includes('egg')) return 'egg';
    if (n.includes('молок') || n.includes('milk') || n.includes('вершк')) return 'milk';
    if (n.includes('лист') || n.includes('базилік') || n.includes('basil') || n.includes('herb') || n.includes('зелен')) return 'leaf';
    if (n.includes('м\'яс') || n.includes('meat') || n.includes('beef') || n.includes('свинин')) return 'beef';
    if (n.includes('рис') || n.includes('rice') || n.includes('крупа') || n.includes('борошн') || n.includes('flour')) return 'wheat';
    if (n.includes('рибa') || n.includes('fish') || n.includes('лосос') || n.includes('salmon')) return 'fish';
    if (n.includes('сіль') || n.includes('salt') || n.includes('перець') || n.includes('pepper') || n.includes('спец')) return 'flame';
    if (n.includes('цибул') || n.includes('onion') || n.includes('часник') || n.includes('garlic')) return 'salad';
    if (n.includes('масл') || n.includes('butter') || n.includes('oil') || n.includes('олі')) return 'droplets';
    if (n.includes('цукор') || n.includes('sugar') || n.includes('мед') || n.includes('honey')) return 'candy';
    if (n.includes('вод') || n.includes('water')) return 'droplets';
    return 'circle-dot';
  }

  async template() {
    const d = this.recipeData || {};
    const title = d.title || 'Без назви';
    const subtitle = d.description || d.subtitle || '';
    const category = d.category || '';
    const imageUrl = d.image_url || '';
    const ingredients = d.ingredients || [];

    // Gallery: main image + 2 side placeholders
    const mainImg = imageUrl
      ? `<img src="${imageUrl}" alt="${title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#a16e45;display:grid;place-items:center;color:white;font-family:var(--font-title)\\'>No Photo</div>'">`
      : `<div style="width:100%;height:100%;background:#a16e45;display:grid;place-items:center;color:white;font-family:var(--font-title);">No Photo</div>`;

    // Ingredients HTML
    const ingredientsHtml = ingredients.map(ing => {
      const name = typeof ing === 'string' ? ing : (ing.name || ing.title || '');
      const amount = typeof ing === 'string' ? '' : (ing.amount || ing.quantity || '');
      const icon = this._getIngredientIcon(name);
      return `
        <div class="ing-card">
          <div class="ing-icon-wrapper">
            <i data-lucide="${icon}" style="width: 32px; height: 32px;"></i>
          </div>
          <div class="ing-name" title="${name}">${name}</div>
          <div class="ing-amounts">
            <span class="ing-required-amount">${amount}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="recipe-view-container">
        <div class="recipe-scroll-area">
          <div class="recipe-inner-wrap">
            
            <div class="recipe-header-nav" style="flex-direction: column; text-align: center; border: none; padding-top: 16px;">
              <h2 style="font-family: var(--font-title, serif); font-size: 2.2rem; color: var(--ink);">${title}</h2>
              ${subtitle ? `<p style="font-size: 0.95rem; color: #666; font-style: italic;">${subtitle}</p>` : ''}
              ${category ? `<p style="font-size: 0.75rem; color: var(--crimson, #8b1a1a); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">${category}</p>` : ''}
            </div>

            <!-- Centaur Style Photo Gallery -->
            <div class="centaur-gallery">
              <div class="gallery-photo side-left">
                <div style="width:100%;height:100%;background:#805533;"></div>
              </div>
              <div class="gallery-photo side-right">
                <div style="width:100%;height:100%;background:#5a3c24;"></div>
              </div>
              <div class="gallery-photo main">
                ${mainImg}
              </div>
            </div>

            <!-- Ingredients List -->
            ${ingredients.length > 0 ? `
            <div class="ingredients-section">
              <h3>Інгредієнти</h3>
              <div class="ingredients-grid">
                ${ingredientsHtml}
              </div>
            </div>
            ` : ''}

            <!-- Dynamic mount point for instructions to "roll down" -->
            <div id="recipe-instructions-mount" class="collapsed"></div>
            
          </div>
        </div>

        <!-- Action Buttons pinned at bottom -->
        <div class="recipe-actions-row">
          <button type="button" class="arc-glyph arc-glyph--convex" id="btn-plan-recipe">
            <i data-lucide="calendar-plus"></i> Запланувати
          </button>
          <button type="button" class="arc-glyph arc-glyph--convex" id="btn-more-details">
            <i data-lucide="scroll-text"></i> Детальна Інструкція
          </button>
        </div>
      </div>
    `;
  }

  async onMount() {
    const btn = this.$('#btn-more-details');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle the internal state instead of calling parent pushed substate
        const mount = this.$('#recipe-instructions-mount');
        if (mount.classList.contains('collapsed')) {
          mount.classList.remove('collapsed');
          mount.classList.add('expanded');
          btn.classList.remove('arc-glyph--convex');
          btn.classList.add('arc-glyph--concave');
          btn.innerHTML = '<i data-lucide="chevron-up"></i> Приховати';
          if (window.lucide) window.lucide.createIcons({ root: btn });
          this.onMoreDetails(mount);
        } else {
          mount.classList.remove('expanded');
          mount.classList.add('collapsed');
          btn.classList.remove('arc-glyph--concave');
          btn.classList.add('arc-glyph--convex');
          btn.innerHTML = '<i data-lucide="scroll-text"></i> Детальна Інструкція';
          if (window.lucide) window.lucide.createIcons({ root: btn });
        }
      });
    }
  }
}
