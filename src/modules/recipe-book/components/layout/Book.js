import Component from "../../../../core/Component.js";
import PageLeft from "./PageLeft.js";
import PageRight from "./PageRight.js";

export default class Book extends Component {
  async onMount() {
    const pageLeft = new PageLeft({ recipes: this.props.recipes });
    const pageRight = new PageRight();

    const leftEl = await pageLeft.render();
    const rightEl = await pageRight.render();

    const cover = this.element.querySelector(".book-cover");

    // Use replaceWith for the existing .spine to place pages correctly
    // Or just append before the spine like the DOM structure:
    // .book-cover > .bookmark-btn, .page--left, .spine, .page--right
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
