import Component from '../../core/Component.js';
import { RecipeService } from '../../core/ApiClient.js';
import Recipe from '../recipe/Recipe.js';

export default class RecipeBookRightPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onBack = props.onBack || (() => {});
    this.recipeComponent = null;
    this.currentRecipeId = null;
  }

  async template() {
    return `
      <div style="height: 100%; display: flex; flex-direction: column; position: relative;">
        <button class="rb-back-btn" id="rb-back-trigger">
          <i data-lucide="chevron-left"></i> Назад до списку
        </button>

        <div id="recipe-mount-point" style="flex: 1; display: flex; flex-direction: column; width: 100%;">
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
    if (this.currentRecipeId === String(id)) return;
    this.currentRecipeId = String(id);

    // Show loading
    mountContainer.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;opacity:0.5;">
        <i data-lucide="loader" style="width:32px;height:32px;animation:spin 1s linear infinite;"></i>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: mountContainer });

    // Fetch recipe detail from API
    const recipe = await RecipeService.fetchDetail(id);

    mountContainer.innerHTML = '';

    this.recipeComponent = new Recipe({
      recipeId: id,
      recipeData: recipe?.data || null,
    });
    await this.recipeComponent.render(mountContainer, 'innerHTML');

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }
}
