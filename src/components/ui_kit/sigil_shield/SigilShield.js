import Component from '../../../core/Component.js';

export default class SigilShield extends Component {
  constructor(props = {}) {
    super(props);
    // props: { icon: lucide-name, variant: 'normal'|'double' }
  }

  async template() {
    const icon = this.props.icon || 'shield';
    const variant = this.props.variant || 'normal';
    const doubleClass = variant === 'double' ? ' arc-sigil-shield--double' : '';

    return `
      <div class="arc-sigil-shield${doubleClass}">
        <i data-lucide="${icon}" style="width:32px;height:32px;"></i>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
