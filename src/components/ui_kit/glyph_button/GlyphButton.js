import Component from '../../../core/Component.js';

export default class GlyphButton extends Component {
  constructor(props = {}) {
    super(props);
    // props: { label, variant: 'concave'|'convex'|'radial'|'pill'|'ingot', onClick }
  }

  async template() {
    const variant = this.props.variant || 'concave';
    const label = this.props.label || 'BUTTON';
    return `
      <div class="arc-glyph arc-glyph--${variant}">
        ${label}
      </div>
    `;
  }

  async onMount() {
    const btn = this.$('.arc-glyph');
    if (this.props.onClick) {
      btn?.addEventListener('click', this.props.onClick);
    }
  }
}
