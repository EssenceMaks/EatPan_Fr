import Component from '../../../core/Component.js';

export default class GlyphRunic extends Component {
  constructor(props = {}) {
    super(props);
    // props: { label, variant: 'single'|'dside'|'dfull', color: 'theme'|'brown'|'gold' }
  }

  async template() {
    const variant = this.props.variant || 'single';
    const color = this.props.color || 'theme';
    const label = this.props.label || 'RUNIC';
    const colorClass = color !== 'theme' ? ` arc-glyph-runic--${color}` : '';

    if (variant === 'single') {
      return `
        <div class="arc-glyph-runic-single${colorClass}">
          <div class="arc-glyph-runic-single__inner">${label}</div>
        </div>`;
    }
    if (variant === 'dside') {
      return `
        <div class="arc-glyph-runic-dside${colorClass}">
          <div class="arc-glyph-runic-dside__gap">
            <div class="arc-glyph-runic-dside__iborder">
              <div class="arc-glyph-runic-dside__inner">${label}</div>
            </div>
          </div>
        </div>`;
    }
    // dfull
    return `
      <div class="arc-glyph-runic-dfull${colorClass}">
        <div class="arc-glyph-runic-dfull__gap">
          <div class="arc-glyph-runic-dfull__iborder">
            <div class="arc-glyph-runic-dfull__inner">${label}</div>
          </div>
        </div>
      </div>`;
  }
}
