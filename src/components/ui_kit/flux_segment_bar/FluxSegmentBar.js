import Component from '../../../core/Component.js';

export default class FluxSegmentBar extends Component {
  constructor(props = {}) {
    super(props);
    // props: { total: number, filled: number, variant: 'gold'|'theme' }
  }

  async template() {
    const total = this.props.total || 10;
    const filled = this.props.filled ?? 6;
    const variant = this.props.variant || 'gold';

    const activeClass = variant === 'theme' ? 'arc-flux-seg__cell--theme-active' : 'arc-flux-seg__cell--active';
    const cells = Array.from({ length: total }, (_, i) => 
      `<div class="arc-flux-seg__cell${i < filled ? ` ${activeClass}` : ''}"></div>`
    ).join('');

    return `<div class="arc-flux-seg">${cells}</div>`;
  }
}
