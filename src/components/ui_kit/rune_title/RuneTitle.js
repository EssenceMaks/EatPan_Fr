import Component from '../../../core/Component.js';

export default class RuneTitle extends Component {
  constructor(props = {}) {
    super(props);
    // props: { text, size: 'normal' | 'sm' }
  }

  async template() {
    const sizeClass = this.props.size === 'sm' ? ' arc-rune-title--sm' : '';
    return `
      <div class="arc-rune-title${sizeClass}">
        ${this.props.text || 'SECTION TITLE'}
      </div>
    `;
  }
}
