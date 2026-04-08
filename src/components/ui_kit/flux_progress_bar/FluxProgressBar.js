import Component from '../../../core/Component.js';

export default class FluxProgressBar extends Component {
  constructor(props = {}) {
    super(props);
    // props: { label, value (0-100), variant: 'solid'|'seg'|'pill'|'theme' }
  }

  async template() {
    const variant = this.props.variant || 'solid';
    const value = this.props.value ?? 60;
    const label = this.props.label || '';

    let fillHtml = '';
    if (variant === 'solid') {
      fillHtml = `<div class="arc-flux-prog__fill--solid" style="width:${value}%"></div>`;
    } else if (variant === 'seg') {
      fillHtml = `<div class="arc-flux-prog__fill-seg-wrap"><div class="arc-flux-prog__fill--seg" style="width:${value}%"></div></div>`;
    } else if (variant === 'pill') {
      fillHtml = `<div class="arc-flux-prog__fill--pill" style="width:${value}%"></div>`;
    } else if (variant === 'theme') {
      fillHtml = `<div class="arc-flux-prog__fill--theme" style="width:${value}%"></div>`;
    }

    return `
      <div class="arc-flux-prog">
        ${label ? `<span class="arc-flux-prog__label">${label}</span>` : ''}
        <div class="arc-flux-prog__outer">
          <div class="arc-flux-prog__inner">
            ${fillHtml}
          </div>
        </div>
      </div>
    `;
  }
}
