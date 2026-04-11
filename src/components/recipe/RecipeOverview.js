import Component from '../../core/Component.js';
import { IS_LOCAL } from '../../core/ApiClient.js';

export default class RecipeOverview extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeData = props.recipeData || {};
    this.mediaAssets = props.mediaAssets || [];
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

  /**
   * Build main gallery image/placeholder.
   * Type A: recipe has a photo URL → show <img> with onerror fallback "local machine offline".
   * Type B: recipe has NO photo → decorative Lucide icon placeholder.
   */
  _buildMainImage(imageUrl, title) {
    if (imageUrl) {
      // Has image URL — show it; if local machine is offline the image fails to load
      return `<img src="${imageUrl}" alt="${title}"
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.parentElement.innerHTML='<div class=\\'gallery-placeholder gallery-placeholder--offline\\'><i data-lucide=\\'server-off\\' style=\\'width:36px;height:36px;opacity:0.5;\\'></i><span>Локальна машина<br>не в мережі</span></div>';if(window.lucide)lucide.createIcons({root:this.parentElement.parentElement});">`;
    }
    // No image URL — recipe has no photo
    return `<div class="gallery-placeholder gallery-placeholder--no-photo">
      <i data-lucide="image-off" style="width:40px;height:40px;opacity:0.35;"></i>
      <span>Без фото</span>
    </div>`;
  }

  async template() {
    const d = this.recipeData || {};
    const title = d.title || 'Без назви';
    const subtitle = d.description || d.subtitle || '';
    const category = d.category || '';
    const imageUrl = d.image_url || d.photo_url || '';
    const ingredients = d.ingredients || [];

    // Resolve image URL from media_assets using UUID in data.media.images
    let resolvedImageUrl = imageUrl;
    if (!resolvedImageUrl && this.mediaAssets.length > 0) {
      // Try to find the first image asset
      const mediaRef = d.media?.images?.[0]; // UUID reference
      if (mediaRef) {
        const asset = this.mediaAssets.find(a => a.uuid === mediaRef);
        if (asset?.url) resolvedImageUrl = asset.url;
      }
      // Fallback: just use the first image-type asset
      if (!resolvedImageUrl) {
        const firstImage = this.mediaAssets.find(a => a.kind === 'image');
        if (firstImage?.url) resolvedImageUrl = firstImage.url;
      }
    }

    // Gallery: main image with smart fallback
    const mainImg = this._buildMainImage(resolvedImageUrl, title);

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

            <!-- Preparation Steps Accordion -->
            <div class="prep-steps-accordion" id="prep-steps-accordion">
              <div class="prep-steps-header" id="prep-steps-toggle">
                <h3 class="steps-main-title" style="margin:0;border:none;padding:0;">Preparation Steps</h3>
                <button class="prep-steps-diamond-btn" id="diamond-toggle" type="button" title="Розгорнути інструкцію">
                  <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
                </button>
              </div>
              <div id="recipe-instructions-mount" class="collapsed"></div>
            </div>
            
          </div>
        </div>

      </div>
    `;
  }

  async onMount() {
    const toggle = this.$('#prep-steps-toggle');
    const diamondBtn = this.$('#diamond-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const mount = this.$('#recipe-instructions-mount');
        const isCollapsed = mount.classList.contains('collapsed');
        
        if (isCollapsed) {
          mount.classList.remove('collapsed');
          mount.classList.add('expanded');
          diamondBtn.classList.add('is-open');
          this.onMoreDetails(mount);
        } else {
          mount.classList.remove('expanded');
          mount.classList.add('collapsed');
          diamondBtn.classList.remove('is-open');
        }
      });
    }
  }
}
