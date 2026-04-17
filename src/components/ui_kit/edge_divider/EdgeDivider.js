import Component from '../../../core/Component.js';

export default class EdgeDivider extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    return `
      <div class="arc-edge-divider">
        <div class="arc-edge-divider__line"></div>
        <div class="arc-edge-divider__icon">
          <i data-lucide="diamond"></i>
        </div>
        <div class="arc-edge-divider__line"></div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
