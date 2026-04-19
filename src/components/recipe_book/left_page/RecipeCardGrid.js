import Component from '../../../core/Component.js';
import { resolveMediaUrl } from '../../../core/mediaResolver.js';

export default class RecipeCardGrid extends Component {
  constructor(props = {}) {
    super(props);
    this.recipes = props.recipes || [];
    this.onSelectRecipe = props.onSelectRecipe || (() => {});
    
    // Infinite scroll props
    this.hasMore = props.hasMore || false;
    this.isLoadingMore = props.isLoadingMore || false;
    this.onLoadMore = props.onLoadMore || null;
    this._observer = null;
  }

  // Get recipe main image from media.images or null
  _getRecipeImage(recipe) {
    if (!recipe.data) return null;
    
    if (recipe.data.media && Array.isArray(recipe.data.media.images) && recipe.data.media.images.length > 0) {
      const imgPath = recipe.data.media.images[0];
      if (imgPath && String(imgPath).startsWith('http')) {
         return resolveMediaUrl(imgPath);
      } else {
         // Resolve UUID from the populated media_assets list provided by the backend
         if (Array.isArray(recipe.media_assets)) {
            const asset = recipe.media_assets.find(a => a.uuid === imgPath);
            if (asset && asset.url) {
               return resolveMediaUrl(asset.url);
            }
         }
      }
    }
    
    // Legacy support
    if (recipe.data.image_url) return resolveMediaUrl(recipe.data.image_url);
    if (recipe.data.image) return resolveMediaUrl(recipe.data.image);
    
    return null;
  }

  async template() {
    if (this.recipes.length === 0) {
      return `
        <div class="book-page-scroll" style="display:flex;flex-direction:column;align-items:center;padding-top:40px;opacity:0.5;">
          <p style="font-family:var(--font-title,serif);font-style:italic;">Немає рецептів в цій категорії.</p>
        </div>
      `;
    }

    const cards = this.recipes.map(r => {
      const imgUrl = this._getRecipeImage(r);
      const title = r.data?.title || 'Без назви';
      const cookTime = r.data?.prep_time ? `${r.data.prep_time} хв` : '15 хв';
      
      let imgHtml = '';
      if (imgUrl) {
        imgHtml = `<img alt="${title}" class="arc-recipe-img" src="${imgUrl}" onerror="const p=this.parentElement; p.innerHTML='<div style=\\'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:10px;background:var(--color-surface-card);color:var(--color-text-muted);\\'><i data-lucide=\\'server-off\\' style=\\'width:24px;height:24px;margin-bottom:8px;\\'></i><span style=\\'font-size:10px;line-height:1.2;font-family:var(--font-primary);\\'>Фото доступне<br>при локальному<br>сервері</span></div>'; if(window.lucide) window.lucide.createIcons({root: p});" />`;
      } else {
        imgHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:10px;background:var(--color-surface-card);color:var(--color-text-muted);">
            <i data-lucide="camera-off" style="width:24px;height:24px;margin-bottom:8px;"></i>
            <span style="font-size:10px;line-height:1.2;font-family:var(--font-primary);">Відсутнє фото,<br>добавте</span>
          </div>
        `;
      }

      return `
        <div class="arc-recipe-card" data-id="${r.id}">
          <div class="arc-recipe-img-wrapper">
            ${imgHtml}
          </div>
          <div class="arc-recipe-info">
            <div class="arc-recipe-title" title="${title}">${title}</div>
            <div class="arc-recipe-meta">
              <i data-lucide="clock" style="width:12px;height:12px;"></i>
              <span>${cookTime}</span>
            </div>
          </div>
        </div>
      `;
    });

    return `
      <div class="rb-categories-grid">
        ${cards.join('')}
      </div>
      ${this.hasMore ? `
        <div id="rb-infinite-scroll-trigger" style="height: 40px; display: flex; justify-content: center; align-items: center; opacity: 0.5; margin-top: 20px;">
          ${this.isLoadingMore ? '<i data-lucide="loader" style="animation: spin 1s linear infinite;"></i>' : ''}
        </div>
      ` : ''}
    `;
  }

  async onMount() {
    this.$$('.arc-recipe-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.onSelectRecipe(id);
      });
    });

    const grid = this.$('.rb-categories-grid');
    if (grid) {
      if (this.animationInterval) clearInterval(this.animationInterval);
      this.animationInterval = setInterval(() => {
        if (grid.querySelector('.arc-recipe-card:hover')) return;
        const cards = this.$$('.arc-recipe-card');
        if (cards.length === 0) return;
        
        const randIndex = Math.floor(Math.random() * cards.length);
        const card = cards[randIndex];
        card.classList.add('arc-hover-simulate');
        
        setTimeout(() => {
          if (card && card.isConnected) card.classList.remove('arc-hover-simulate');
        }, 1500);
      }, 2000);
    }

    if (this.hasMore && this.onLoadMore) {
      const trigger = this.$('#rb-infinite-scroll-trigger');
      if (trigger) {
        this._observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && !this.isLoadingMore) {
            this.onLoadMore();
          }
        }, { rootMargin: '200px' });
        this._observer.observe(trigger);
      }
    }
    
    if (window.lucide) window.lucide.createIcons({ root: this.element });
  }

  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this.animationInterval) clearInterval(this.animationInterval);
    super.destroy();
  }

  updateData(recipes, hasMore = false, isLoadingMore = false) {
    if (this.animationInterval) clearInterval(this.animationInterval);
    this.recipes = recipes;
    this.hasMore = hasMore;
    this.isLoadingMore = isLoadingMore;
    this.update();
  }
}
