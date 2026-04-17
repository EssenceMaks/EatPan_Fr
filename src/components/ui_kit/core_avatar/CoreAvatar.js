import Component from '../../../core/Component.js';

export default class CoreAvatar extends Component {
  constructor(props = {}) {
    super(props);
    // props: { icon: lucide-name, size: 'sm'|'md'|'lg', rounded: boolean }
  }

  async template() {
    const icon = this.props.icon || 'user';
    const size = this.props.size || 'md';
    const rounded = this.props.rounded ? ' arc-core-avatar--rounded' : '';
    const iconSize = size === 'lg' ? 36 : size === 'md' ? 24 : 18;

    return `
      <div class="arc-core-avatar arc-core-avatar--${size}${rounded}">
        <i data-lucide="${icon}" style="width:${iconSize}px;height:${iconSize}px;"></i>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
