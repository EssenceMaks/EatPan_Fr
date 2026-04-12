import Component from '../../core/Component.js';

export default class ArcDialog extends Component {
  constructor(props = {}) {
    super(props);
    // props: { title, text, buttons: [{ label, variant }] }
  }

  async template() {
    const title = this.props.title || 'УВАГА, МАНДРІВНИКУ!';
    const text = this.props.text || 'Ваш шлях визначено. Оберіть дію.';
    const buttons = this.props.buttons || [
      { label: 'ПРИЙНЯТИ ЗАВДАННЯ', variant: 'concave' },
      { label: 'ВІДХИЛИТИ', variant: 'convex' },
    ];

    const buttonsHtml = buttons.map(b =>
      `<button class="arc-glyph-btn arc-glyph-btn--${b.variant}">${b.label}</button>`
    ).join('');

    return `
      <div class="arc-dialog">
        <div class="arc-dialog__header">
          <span class="arc-dialog__corner arc-dialog__corner--tl"></span>
          <span class="arc-dialog__corner arc-dialog__corner--tr"></span>
          <span class="arc-dialog__corner arc-dialog__corner--bl"></span>
          <span class="arc-dialog__corner arc-dialog__corner--br"></span>
          <strong class="arc-dialog__title">${title}</strong>
          <span class="arc-dialog__text">${text}</span>
          <div class="arc-dialog__actions">
            ${buttonsHtml}
          </div>
        </div>
      </div>
    `;
  }
}
