import Component from '../../core/Component.js';
import { IS_LOCAL } from '../../core/ApiClient.js';

export default class RecipeOverview extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeData = props.recipeData || {};
    this.mediaAssets = props.mediaAssets || [];
    this.onMoreDetails = props.onMoreDetails || (() => { });
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
    const ingredientsHtml = ingredients.map((ing, i) => {
      const name = typeof ing === 'string' ? ing : (ing.name || ing.title || '');
      const amount = typeof ing === 'string' ? '' : (ing.amount || ing.quantity || '');
      const icon = this._getIngredientIcon(name);

      // Smart mock logic to show UI design states if no data provided
      let stockStr = typeof ing === 'object' ? ing.stock : null;
      let statusClass = typeof ing === 'object' ? ing.statusClass : null;
      let statusIcon = typeof ing === 'object' ? ing.statusIcon : null;
      let displayStock = stockStr;

      if (!stockStr) {
        let reqNumStr = '';
        let unit = '';
        
        if (amount) {
          const lowerAmount = amount.toLowerCase();
          if (!lowerAmount.includes('taste') && !lowerAmount.includes('смаком')) {
            const match = amount.match(/^([\d\s½¼¾\.\,\/]*)(.*)$/);
            if (match) {
                reqNumStr = match[1].trim();
                unit = match[2].trim();
            } else {
                unit = amount.trim();
            }
          }
        }
        
        if (!reqNumStr) reqNumStr = '1';

        let reqNumLogic = parseFloat(String(reqNumStr).replace(',', '.'));
        if (isNaN(reqNumLogic) || reqNumLogic <= 0) reqNumLogic = 1;

        if (i % 3 === 0) { // OK
           let avail = reqNumLogic >= 10 ? Math.round(reqNumLogic * 1.5) : 50;
           if (avail <= reqNumLogic) avail = reqNumLogic + 5;
           stockStr = `${reqNumStr}/${avail}`;
           statusClass = "status-ok"; 
           statusIcon = "check";
        } else if (i % 3 === 1) { // Partial
           let avail = Math.max(1, Math.floor(reqNumLogic / 2));
           stockStr = `${reqNumStr}/${avail}`; 
           statusClass = "status-missing warning"; 
           statusIcon = "alert-circle"; // Orange exclamation pattern
        } else { // Empty
           stockStr = `${reqNumStr}/0`; 
           statusClass = "status-missing"; 
           statusIcon = "circle-dashed"; // Purely missing zero state
        }
        
        if (unit) {
           const cleaned = unit.toLowerCase().replace(/[^a-zа-яёіїєґ]/g, '');
           const validUnits = ['g', 'kg', 'mg', 'ml', 'l', 'oz', 'lb', 'tbsp', 'tbs', 'tsp', 'cup', 'cups', 'г', 'кг', 'мл', 'л', 'шт', 'pcs'];
           if (!validUnits.includes(cleaned)) unit = '';
        }
        
        displayStock = unit ? `${stockStr} ${unit}` : stockStr;
      } else {
        // Fallback for actual data provided to append units
        let unit = '';
        if (amount) {
           const lowerAmount = amount.toLowerCase();
           if (!lowerAmount.includes('taste') && !lowerAmount.includes('смаком')) {
             unit = amount.replace(/^[\d\s½¼¾\.\,\/]+/, '').trim();
           }
        }
        if (unit) {
           const cleaned = unit.toLowerCase().replace(/[^a-zа-яёіїєґ]/g, '');
           const validUnits = ['g', 'kg', 'mg', 'ml', 'l', 'oz', 'lb', 'tbsp', 'tbs', 'tsp', 'cup', 'cups', 'г', 'кг', 'мл', 'л', 'шт', 'pcs'];
           if (!validUnits.includes(cleaned)) unit = '';
        }

        displayStock = unit && typeof stockStr === 'string' && !stockStr.includes(unit) 
            ? `${stockStr} ${unit}` 
            : stockStr;
      }

      return `
        <div class="ing-card">
          <div class="ing-icon-wrapper">
            <i data-lucide="${icon}" style="width: 32px; height: 32px;"></i>
          </div>
          <div class="ing-name" title="${name}">${name}</div>
          <div class="ing-amounts">
            <span class="ing-required-amount">${amount} ${amount ? '<span class="separator">|</span>' : ''}</span>
            <span class="${statusClass}">
              ${displayStock} <i data-lucide="${statusIcon}" style="width: 16px; height: 16px;"></i>
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Parse Secrets
    let secretsArr = [];
    if (d.secrets && Array.isArray(d.secrets)) secretsArr = d.secrets;
    else if (d.secret && Array.isArray(d.secret)) secretsArr = d.secret;
    else if (d.secret && typeof d.secret === 'string' && d.secret.trim()) secretsArr = [d.secret];
    
    let secretsHtml = secretsArr.length > 0
      ? secretsArr.map((s, i) => {
          let t = typeof s === 'string' ? s : (s.text || s.description || '');
          let mb = i < secretsArr.length - 1 ? 'margin-bottom: 12px;' : '';
          return `<p class="recipe-extra-text" style="${mb}">${t}</p>`;
        }).join('')
      : '<p class="recipe-extra-text"><em style="opacity:0.6;">Додайте свій секрет шефа</em></p>';

    // Parse Utensils (formerly Serving)
    let servingArr = [];
    if (d.serving_recommendations && Array.isArray(d.serving_recommendations)) servingArr = d.serving_recommendations;
    else if (d.serving_recommendation && Array.isArray(d.serving_recommendation)) servingArr = d.serving_recommendation;
    else if (d.serving && Array.isArray(d.serving)) servingArr = d.serving;
    else if (d.serving_recommendation && typeof d.serving_recommendation === 'string' && d.serving_recommendation.trim()) servingArr = [d.serving_recommendation];
    else if (d.serving && typeof d.serving === 'string' && d.serving.trim()) servingArr = [d.serving];

    let servingHtml = servingArr.length > 0
      ? servingArr.map((s, i) => {
          let t = typeof s === 'string' ? s : (s.text || s.description || '');
          let mb = i < servingArr.length - 1 ? 'margin-bottom: 12px;' : '';
          return `<p class="recipe-extra-text" style="${mb}">${t}</p>`;
        }).join('')
      : '<p class="recipe-extra-text"><em style="opacity:0.6;">Додайте необхідне приладдя</em></p>';

    return `
      <div class="recipe-view-container book-page-container">
        <!-- New sticky header -->
        <div class="book-page-header">
          <h2 class="rb-title">${title}</h2>
        </div>

        <!-- Mobile Interaction Tabs (visible only on mobile) -->
        <div class="rb-mobile-action-tabs">
          <div class="bm-mobile-cluster">
            <button class="bm-mobile-tab" title="Вподобати"><i data-lucide="heart"></i><span>0</span></button>
            <button class="bm-mobile-tab" title="Поділитися"><i data-lucide="send"></i></button>
            <button class="bm-mobile-tab" title="Репости"><i data-lucide="repeat"></i><span>42</span></button>
            <button class="bm-mobile-tab" title="Коментарі"><i data-lucide="message-square"></i><span>18</span></button>
          </div>
          
          <div class="bm-mobile-cluster">
            <button class="bm-mobile-tab" title="Редагувати"><i data-lucide="feather"></i></button>
            <button class="bm-mobile-tab active" title="Варіант 1"><span>1 в.</span></button>
            <button class="bm-mobile-tab" title="Варіант 2"><span>2 в.</span></button>
            <button class="bm-mobile-tab" title="Друк"><i data-lucide="printer"></i></button>
            <button class="bm-mobile-tab" title="Додати варіант"><i data-lucide="plus"></i></button>
          </div>
        </div>

        <div class="book-page-scroll-spine-left">
          <div class="recipe-inner-wrap">
            
            <!-- Sticky header extracted, subtitles inside scroll -->
            <div class="recipe-sub-header" style="text-align: center; margin-bottom: 16px;">
              ${subtitle ? `<p style="font-size: 0.95rem; color: #666; font-style: italic; margin-top: 0; margin-bottom: 4px;">${subtitle}</p>` : ''}
              ${category ? `<p style="font-size: 0.75rem; color: var(--crimson, #8b1a1a); text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">${category}</p>` : ''}
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
                <h3 class="steps-main-title" style="margin:0;border:none;padding:0;">Процес приготування</h3>
                <button class="prep-steps-diamond-btn" id="diamond-toggle" type="button" title="Розгорнути інструкцію">
                  <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
                </button>
              </div>
              <div id="recipe-instructions-mount" class="collapsed"></div>
            </div>

            <!-- Chef's Secret -->
            <div class="recipe-extra-section recipe-secret-section">
              <div class="recipe-extra-header">
                <div class="recipe-extra-icon">
                  <i data-lucide="sparkles" style="width:18px;height:18px;"></i>
                </div>
                <h4 class="recipe-extra-title">Секрет шефа</h4>
              </div>
              ${secretsHtml}
            </div>

            <!-- Utensils (Formerly Serving) -->
            <div class="recipe-extra-section recipe-serving-section">
              <div class="recipe-extra-header">
                <div class="recipe-extra-icon">
                  <i data-lucide="utensils-crossed" style="width:18px;height:18px;"></i>
                </div>
                <h4 class="recipe-extra-title">Кухонне приладдя</h4>
              </div>
              ${servingHtml}
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
