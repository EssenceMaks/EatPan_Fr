import Component from '../../core/Component.js';
import Recipe from '../recipe/Recipe.js';

export default class RecipeBookRightPage extends Component {
  constructor(props = {}) {
    super(props);
    this.onBack = props.onBack || (() => {});
    this.recipeComponent = null;
  }

  async template() {
    return `
      <div style="height: 100%; display: flex; flex-direction: column; position: relative;">
        <!-- Visual Back button on Mobile or Desktop, calls onBack which triggers history.back() -->
        <button class="rb-back-btn" id="rb-back-trigger">
          <i data-lucide="chevron-left"></i> Назад к списку
        </button>

        <div id="recipe-mount-point" style="flex: 1; display: flex; flex-direction: column; width: 100%;">
          <!-- Default placeholder before a recipe is selected -->
          <div class="rb-right-content" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0.5;">
            <i data-lucide="chef-hat" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
            <h2 style="font-family: var(--font-title); font-size: 1.4rem;">Select a recipe from the list</h2>
            <p style="font-style: italic; margin-top: 8px;">or create a new one</p>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    const backBtn = this.$('#rb-back-trigger');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.onBack();
      });
    }
  }

  async loadRecipe(id, substate = 'recipe_detail') {
    const mountContainer = this.$('#recipe-mount-point');
    if (!mountContainer) return;

    // Check if we need to instantiate a new component (different recipe)
    if (!this.recipeComponent || this.recipeComponent.recipeId !== id) {
      mountContainer.innerHTML = ''; // Clear placeholder or old recipe
      this.recipeComponent = new Recipe({ recipeId: id });
    }

    // Always re-render / mount the component into the container
    // If it's already the active component, it will just update its substate internally
    if (this.recipeComponent.element && this.recipeComponent.recipeId === id) {
      this.recipeComponent.setSubstate(substate);
    } else {
      await this.recipeComponent.render(mountContainer, 'innerHTML');
      this.recipeComponent.setSubstate(substate);
    }
    
    // Hide the back button on mobile when we go deep into instructions? No, keep it as "Back" 
    // to navigate back visually if they don't swipe. The swipe works too.
  }
}
