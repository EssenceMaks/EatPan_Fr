import Component from '../../../core/Component.js';

export default class GearSlider extends Component {
  constructor(props = {}) {
    super(props);
    // props: { label, variant: 'classic'|'diamond-thin'|'hex'|'hex-diamond'|'theme', value: 0-100 }
  }

  async template() {
    const variant = this.props.variant || 'classic';
    const label = this.props.label || '';
    const value = this.props.value ?? 50;

    return `
      <div class="arc-gear-slider">
        ${label ? `<span class="arc-gear-slider__label">${label}</span>` : ''}
        <input type="range" class="arc-gear-slider__input arc-gear-slider--${variant}" min="0" max="100" value="${value}">
      </div>
    `;
  }
}
