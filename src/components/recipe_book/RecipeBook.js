import Component from '../../core/Component.js';
import RecipeBookLeftPage from './RecipeBookLeftPage.js';
import RecipeBookRightPage from './RecipeBookRightPage.js';

export default class RecipeBook extends Component {
  constructor(props = {}) {
    super(props);
    this.showingRight = false; // State for mobile view
    
    this.leftPage = new RecipeBookLeftPage({
      onRecipeSelected: (id) => this.handleRecipeSelect(id)
    });
    
    this.rightPage = new RecipeBookRightPage({
      onBack: () => this.handleBack()
    });
  }

  async template() {
    return `
      <div class="rb-container">
        <div class="rb-wrapper" id="rb-wrapper">
          <div id="rb-left-mount" class="rb-side rb-left-side"></div>
          <div id="rb-right-mount" class="rb-side rb-right-side"></div>
        </div>
      </div>
    `;
  }

  async onMount() {
    await this.leftPage.render(this.$('#rb-left-mount'), 'innerHTML');
    await this.rightPage.render(this.$('#rb-right-mount'), 'innerHTML');
    
    // Re-instantiate icons
    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }

    // Set up sub-state routing natively using popstate to handle Mobile Back button
    this._popStateHandler = (e) => {
      const state = e?.state;
      if (state && state.substate === 'recipe_detail') {
        this._showRightSide(state.recipeId, state.substate);
      } else {
        this._hideRightSide();
      }
    };
    window.addEventListener('popstate', this._popStateHandler);

    this._setupSwipeToClose();
  }

  _setupSwipeToClose() {
    let startX = 0;
    let startY = 0;
    const wrapper = this.$('#rb-wrapper');
    if (!wrapper) return;

    wrapper.addEventListener('touchstart', (e) => {
      // Only record touch if the right side is visible (on mobile)
      if (!this.showingRight || window.innerWidth > 899) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      if (!this.showingRight || window.innerWidth > 899) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const dx = endX - startX;
      const dy = endY - startY;

      // Detect light swipe right (left-to-right)
      if (dx > 40 && Math.abs(dy) < 50) {
        this.handleBack();
      }
    }, { passive: true });
  }

  onDestroy() {
    if (this._popStateHandler) {
      window.removeEventListener('popstate', this._popStateHandler);
    }
  }

  handleRecipeSelect(id) {
    const parentIndex = history.state?.index || '4'; // Maintain Sector Carousel state
    
    // Push our detailed state to browser history!
    history.pushState({ 
      type: 'block', 
      index: parentIndex, 
      substate: 'recipe_detail', 
      recipeId: id 
    }, null, '');

    this._showRightSide(id);
  }

  handleBack() {
    // Instead of forcing the UI back manually, pop the browser history
    history.back();
  }

  _showRightSide(id, substate = 'recipe_detail') {
    this.showingRight = true;
    const wrapper = this.$('#rb-wrapper');
    if (wrapper) wrapper.classList.add('mobile-show-right');
    this.rightPage.loadRecipe(id, substate);
  }

  _hideRightSide() {
    this.showingRight = false;
    const wrapper = this.$('#rb-wrapper');
    if (wrapper) wrapper.classList.remove('mobile-show-right');
  }
}
