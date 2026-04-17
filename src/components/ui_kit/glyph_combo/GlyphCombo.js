import Component from '../../../core/Component.js';

export default class GlyphCombo extends Component {
  constructor(props = {}) {
    super(props);
    // props: { label, icon: lucide-name, variant: 'center'|'ltr' }
  }

  async template() {
    const variant = this.props.variant || 'center';
    const label = this.props.label || 'COMBO BUTTON';
    const icon = this.props.icon || 'sword';
    const ltrClass = variant === 'ltr' ? ' arc-glyph-combo__text--ltr' : '';

    return `
      <div class="arc-glyph-combo">
        <div class="arc-glyph-combo__icon">
          <i data-lucide="${icon}" style="width:24px;height:24px;"></i>
        </div>
        <div class="arc-glyph-combo__text${ltrClass}">${label}</div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
