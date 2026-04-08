import Component from '../../core/Component.js';

export default class ArcPopup extends Component {
  constructor(props = {}) {
    super(props);
    // props: { title, body, buttons: [{ label, variant }] }
  }

  async template() {
    const title = this.props.title || 'Подтверждение';
    const body = this.props.body || 'Вы уверены, что хотите продолжить?';
    const buttons = this.props.buttons || [
      { label: 'ДА', variant: 'concave' },
      { label: 'НЕТ', variant: 'convex' },
    ];

    const buttonsHtml = buttons.map(b =>
      `<button class="arc-glyph-btn arc-glyph-btn--${b.variant}" style="flex:1;">${b.label}</button>`
    ).join('');

    return `
      <div class="arc-popup">
        <div class="arc-popup__header">
          <span class="arc-popup__header-title">${title}</span>
          <span class="arc-popup__header-close">
            <i data-lucide="x" style="width:16px;height:16px;"></i>
          </span>
        </div>
        <div class="arc-popup__body">${body}</div>
        <div class="arc-popup__footer">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
