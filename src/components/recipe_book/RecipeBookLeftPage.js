import Component from '../../core/Component.js';

export default class RecipeBookLeftPage extends Component {
  constructor(props = {}) {
    super(props);
    // Callback when user selects a recipe (to trigger mobile slide-out)
    this.onRecipeSelected = props.onRecipeSelected || (() => {});
  }

  async template() {
    return `
      <div>
        <h2 class="rb-title">Categories</h2>
        <div class="rb-mock-list">
          <div class="rb-mock-item" data-id="1">All Categories</div>
          <div class="rb-mock-item" data-id="2">Breakfast & Brunch</div>
          <div class="rb-mock-item" data-id="3">Main Courses</div>
          <div class="rb-mock-item" data-id="4">Desserts</div>
          <div class="rb-mock-item" data-id="5">Beverages</div>
        </div>
      </div>
    `;
  }

  async onMount() {
    // Add click listeners to items
    const items = this.$$('.rb-mock-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.onRecipeSelected(id);
      });
    });
  }
}
