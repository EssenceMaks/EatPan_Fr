import Component from "../../../../core/Component.js";
import PageLeft from "./PageLeft.js";
import PageRight from "./PageRight.js";

export default class Book extends Component {
  async onMount() {
    this.activeRecipe = null;
    window.globalActiveRecipe = null;
    
    this.pageLeft = new PageLeft({ 
        recipes: this.props.recipes || [],
        onRecipeSelect: async (recipe) => {
            this.activeRecipe = recipe;
            window.globalActiveRecipe = recipe;
            if (this.pageRight) {
                await this.pageRight.update({ recipe: this.activeRecipe });

                // On selection, toggle right page visibility for single-page overlays
                const prEl = this.element.querySelector('.page--right');
                if (prEl) {
                    prEl.classList.add('is-open');
                    if (window.innerWidth <= 1024) {
                        history.pushState({ type: 'recipe' }, null, "");
                    }
                }
            }
        }
    });

    window.closeActiveRecipe = () => {
        this.activeRecipe = null;
        window.globalActiveRecipe = null;
        const prEl = this.element?.querySelector('.page--right');
        if (prEl) prEl.classList.remove('is-open');
    };
    
    this.pageRight = new PageRight({ recipe: this.activeRecipe });

    const leftEl = await this.pageLeft.render();
    const rightEl = await this.pageRight.render();

    const cover = this.element.querySelector(".book-cover");
    const spine = cover.querySelector(".spine");
    
    cover.insertBefore(leftEl, spine);
    cover.appendChild(rightEl);
  }

  template() {
    return `
            <div class="book-wrapper">
                <div class="book-cover">
                    <!-- BOOKMARK BUTTON -->
                    <button class="bookmark-btn" onclick="window.toggleCreateRecipe()">
                        <i data-lucide="feather" style="width: 32px; height: 52px; stroke-width: 1.5; margin-bottom: 4px; margin-top: 20px;"></i>
                        <span class="bookmark-text">Створити рецепт</span>
                    </button>
                    <!-- page-left injects here -->
                    <!-- BOOK SPINE -->
                    <div class="spine"></div>
                    <!-- page-right injects here -->
                </div>
            </div>
        `;
  }
}
