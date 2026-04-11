import Component from '../../core/Component.js';
import { RecipeService } from '../../core/ApiClient.js';
import Recipe from '../recipe/Recipe.js';
import RecipeCreateForm from './RecipeCreateForm.js';

export default class RecipeBookRightPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onBack = props.onBack || (() => {});
    this.recipeComponent = null;
    this.createForm = null;
    this.currentRecipeId = null;
    this._mode = 'placeholder'; // 'placeholder' | 'recipe' | 'create'
  }

  async template() {
    return `
      <div style="height: 100%; display: flex; flex-direction: column; position: relative;">
        <button class="rb-back-btn" id="rb-back-trigger" style="display:none;">
          <i data-lucide="chevron-left"></i> Назад до списку
        </button>

        <div id="recipe-mount-point" style="flex: 1; display: flex; flex-direction: column; width: 100%; min-height: 0;">
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

  // ------ RECIPE VIEW ------
  async loadRecipe(id) {
    this._destroyCreateForm();
    this._mode = 'recipe';

    const mountContainer = this.$('#recipe-mount-point');
    if (!mountContainer) return;
    if (this.currentRecipeId === String(id)) return;
    this.currentRecipeId = String(id);

    // Show back button
    const backBtn = this.$('#rb-back-trigger');
    if (backBtn) backBtn.style.display = '';

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
      mediaAssets: recipe?.media_assets || [],
    });
    await this.recipeComponent.render(mountContainer, 'innerHTML');

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  // ------ CREATE FORM ------
  async showCreateForm(callbacks = {}) {
    this._destroyRecipe();
    this._mode = 'create';
    this.currentRecipeId = null;

    const mountContainer = this.$('#recipe-mount-point');
    if (!mountContainer) return;

    // Hide back button — create form has its own close
    const backBtn = this.$('#rb-back-trigger');
    if (backBtn) backBtn.style.display = 'none';

    mountContainer.innerHTML = '';

    this.createForm = new RecipeCreateForm({
      onCreated: callbacks.onCreated || (() => {}),
      onClose: callbacks.onClose || (() => {}),
    });

    await this.createForm.render(mountContainer, 'innerHTML');

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  closeCreateForm() {
    this._destroyCreateForm();
    this._showPlaceholder();
  }

  // ------ HELPERS ------
  _showPlaceholder() {
    this._mode = 'placeholder';
    this.currentRecipeId = null;

    const backBtn = this.$('#rb-back-trigger');
    if (backBtn) backBtn.style.display = 'none';

    const mountContainer = this.$('#recipe-mount-point');
    if (!mountContainer) return;

    mountContainer.innerHTML = `
      <div class="rb-right-content" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0.5;">
        <i data-lucide="chef-hat" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
        <h2 style="font-family: var(--font-title); font-size: 1.4rem;">Оберіть рецепт зі списку</h2>
        <p style="font-style: italic; margin-top: 8px;">або створіть новий</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: mountContainer });
  }

  _destroyCreateForm() {
    if (this.createForm) {
      this.createForm.destroy();
      this.createForm = null;
    }
  }

  _destroyRecipe() {
    if (this.recipeComponent) {
      this.recipeComponent.destroy();
      this.recipeComponent = null;
    }
  }
}
