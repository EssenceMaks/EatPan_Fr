import Component from '../../core/Component.js';
import { RecipeService } from '../../core/ApiClient.js';

export default class RecipeBookRightPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onBack = props.onBack || (() => {});
    this.currentRecipeId = null;
  }

  async template() {
    return `
      <div style="height: 100%; display: flex; flex-direction: column; position: relative;">
        <button class="rb-back-btn" id="rb-back-trigger">
          <i data-lucide="chevron-left"></i> Назад до списку
        </button>

        <div id="recipe-mount-point" style="flex: 1; display: flex; flex-direction: column; width: 100%; overflow-y: auto;">
          <div class="rb-right-content" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0.5;">
            <i data-lucide="chef-hat" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
            <h2 style="font-family: var(--font-title); font-size: 1.4rem;">Оберіть рецепт зі списку</h2>
            <p style="font-style: italic; margin-top: 8px;">або створіть новий</p>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    const backBtn = this.$('#rb-back-trigger');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.onBack());
    }
  }

  async loadRecipe(id) {
    const mountContainer = this.$('#recipe-mount-point');
    if (!mountContainer) return;
    if (this.currentRecipeId === id) return;

    this.currentRecipeId = id;

    // Show loading
    mountContainer.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;opacity:0.5;">
        <i data-lucide="loader" style="width:32px;height:32px;animation:spin 1s linear infinite;"></i>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: mountContainer });

    // Fetch recipe detail from API
    const recipe = await RecipeService.fetchDetail(id);
    if (!recipe || !recipe.data) {
      mountContainer.innerHTML = `
        <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;opacity:0.5;">
          <p style="font-family:var(--font-title);font-style:italic;">Не вдалося завантажити рецепт</p>
        </div>
      `;
      return;
    }

    const d = recipe.data;
    const title = d.title || 'Без назви';
    const category = d.category || '';
    const imageUrl = d.image_url || '';
    const ingredients = d.ingredients || [];
    const steps = d.steps || d.instructions || [];
    const servings = d.servings || '';
    const prepTime = d.prep_time || '';
    const cookTime = d.cook_time || '';

    const imgHtml = imageUrl
      ? `<img src="${imageUrl}" alt="${title}" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;margin-bottom:16px;" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:180px;background:var(--parchment-dark,#c4b48e);border-radius:8px;display:grid;place-items:center;margin-bottom:16px;">
          <i data-lucide="image-off" style="width:48px;height:48px;opacity:0.3;"></i>
        </div>`;

    const statsHtml = [
      prepTime && `<span><i data-lucide="timer" style="width:14px;height:14px;"></i> Підготовка: ${prepTime}</span>`,
      cookTime && `<span><i data-lucide="flame" style="width:14px;height:14px;"></i> Готування: ${cookTime}</span>`,
      servings && `<span><i data-lucide="users" style="width:14px;height:14px;"></i> Порцій: ${servings}</span>`,
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');

    const ingredientsHtml = ingredients.length > 0
      ? `<div style="margin-top:16px;">
          <h3 style="font-family:var(--font-title);font-size:1.1rem;margin-bottom:8px;">Інгредієнти</h3>
          ${ingredients.map(ing => {
            const name = typeof ing === 'string' ? ing : (ing.name || ing.title || '');
            const amount = typeof ing === 'string' ? '' : (ing.amount || ing.quantity || '');
            return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(0,0,0,0.08);font-size:0.9rem;">
              <span>${name}</span>
              <span style="font-weight:600;color:var(--gold-dark,#8b6914);">${amount}</span>
            </div>`;
          }).join('')}
        </div>`
      : '';

    const stepsHtml = Array.isArray(steps) && steps.length > 0
      ? `<div style="margin-top:20px;">
          <h3 style="font-family:var(--font-title);font-size:1.1rem;margin-bottom:12px;">Інструкція</h3>
          ${steps.map((step, i) => {
            const text = typeof step === 'string' ? step : (step.text || step.description || '');
            return `<div style="display:flex;gap:12px;margin-bottom:16px;">
              <span style="font-family:var(--font-title);font-size:1.6rem;font-weight:900;color:var(--crimson,#8b1a1a);opacity:0.2;line-height:1;">${i+1}</span>
              <p style="font-size:0.85rem;line-height:1.6;color:rgba(44,24,16,0.8);">${text}</p>
            </div>`;
          }).join('')}
        </div>`
      : '';

    mountContainer.innerHTML = `
      <div style="padding:20px;">
        <h2 style="font-family:var(--font-title,serif);font-size:1.8rem;color:var(--ink);text-align:center;margin-bottom:4px;">${title}</h2>
        ${category ? `<p style="text-align:center;font-size:0.85rem;color:var(--crimson,#8b1a1a);font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">${category}</p>` : ''}
        ${statsHtml ? `<div style="display:flex;gap:8px;justify-content:center;font-size:0.8rem;opacity:0.6;margin-bottom:16px;flex-wrap:wrap;">${statsHtml}</div>` : ''}
        ${imgHtml}
        ${ingredientsHtml}
        ${stepsHtml}
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: mountContainer });
    }
  }

  setSubstate() {}
}
