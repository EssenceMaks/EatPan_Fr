import Component from '../../../core/Component.js';

export default class ArcSlip extends Component {
  constructor(props = {}) {
    super(props);
    // props: { text, icon: lucide-name, showSeal: boolean }
  }

  async template() {
    const text = this.props.text || 'Paper Slip Message';
    const showSeal = this.props.showSeal !== false;
    const icon = this.props.icon || 'scroll';

    const sealHtml = showSeal 
      ? `<div class="arc-slip__seal"><i data-lucide="${icon}" style="width:12px;height:12px;"></i></div>` 
      : '';

    return `
      <div class="arc-slip">
        ${sealHtml}
        <span>${text}</span>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
