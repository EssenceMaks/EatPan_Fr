import Component from '../../core/Component.js';
import RecipeOverview from './RecipeOverview.js';
import RecipeInstructions from './RecipeInstructions.js';

export default class Recipe extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeId = props.recipeId || null;
    this.recipeData = props.recipeData || null;
    this.mediaAssets = props.mediaAssets || [];
    
    // Internal state instances
    this.overview = new RecipeOverview({
      recipeData: this.recipeData,
      mediaAssets: this.mediaAssets,
      onMoreDetails: async (mountContainer) => {
        await this.instructions.render(mountContainer, 'innerHTML');
        
        if (window.lucide) {
          window.lucide.createIcons({ root: mountContainer });
        }
        
        mountContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    this.instructions = new RecipeInstructions({
      recipeData: this.recipeData,
    });
  }

  async template() {
    return `
      <div class="recipe-wrapper" style="width: 100%; height: 100%;">
        <div id="recipe-dynamic-mount" style="width: 100%; height: 100%;">
          <!-- We now just mount the overview, which contains everything -->
        </div>
      </div>
    `;
  }

  async onMount() {
    this.mountContainer = this.$('#recipe-dynamic-mount');
    
    // Always render overview. There is no substate for steps anymore, just an accordion
    await this.overview.render(this.mountContainer, 'innerHTML');
    
    // Re-bind Lucide icons
    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  // Called manually by RecipeBook or via popstate if navigating deep within the Recipe
  async setSubstate(substate) {
    // Only used to ensure Recipe is fresh. We don't have separate sub-views.
  }
}

