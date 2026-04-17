import Component from '../../../core/Component.js';

export default class FluxStatBar extends Component {
  constructor(props = {}) {
    super(props);
    // props: { label, value, max, type: 'stamina'|'exp'|'health'|'mana', percent }
  }

  async template() {
    const label = this.props.label || 'STAT';
    const value = this.props.value ?? 80;
    const max = this.props.max ?? 100;
    const type = this.props.type || 'stamina';
    const percent = this.props.percent ?? Math.round((value / max) * 100);

    return `
      <div class="arc-flux-stat">
        <span class="arc-flux-stat__label">${label}</span>
        <div class="arc-flux-stat__track">
          <div class="arc-flux-stat__fill arc-flux-stat__fill--${type}" style="width:${percent}%"></div>
        </div>
        <span class="arc-flux-stat__value">${value}/${max}</span>
      </div>
    `;
  }
}
