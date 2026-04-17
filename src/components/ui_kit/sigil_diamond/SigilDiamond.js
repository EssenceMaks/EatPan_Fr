import Component from '../../../core/Component.js';

export default class SigilDiamond extends Component {
  constructor(props = {}) {
    super(props);
    // props: { icon: lucide-name, variant: 'hollow'|'filled' }
  }

  async template() {
    const icon = this.props.icon || 'gem';
    const variant = this.props.variant || 'hollow';
    const filledClass = variant === 'filled' ? ' arc-sigil-diamond--filled' : '';

    return `
      <div class="arc-sigil-diamond${filledClass}">
        <i data-lucide="${icon}" style="width:22px;height:22px;"></i>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
