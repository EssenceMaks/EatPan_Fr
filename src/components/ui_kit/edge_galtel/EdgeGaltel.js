import Component from '../../../core/Component.js';

export default class EdgeGaltel extends Component {
  constructor(props = {}) {
    super(props);
    // props: { variant: 'gold'|'parchment'|'theme' }
  }

  async template() {
    const variant = this.props.variant || 'gold';
    return `<div class="arc-edge-galtel arc-edge-galtel--${variant}"></div>`;
  }
}
