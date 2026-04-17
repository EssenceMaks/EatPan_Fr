import Component from '../../core/Component.js';

export default class ArcPaperBoard extends Component {
  constructor(props = {}) {
    super(props);
    // props: { slips: [{ text, icon, showSeal }] }
  }

  async template() {
    const slips = this.props.slips || [
      { text: 'Замовлення на м\'ясо свині', icon: 'scroll', showSeal: true },
      { text: 'Рецепт зілля мани', icon: 'flame', showSeal: true },
      { text: 'Лист від коваля', icon: 'mail', showSeal: false },
    ];

    const slipsHtml = slips.map(s => {
      const sealHtml = s.showSeal
        ? `<div class="arc-slip__seal"><i data-lucide="${s.icon || 'scroll'}" style="width:12px;height:12px;"></i></div>`
        : '';
      return `
        <div class="arc-slip">
          ${sealHtml}
          <span>${s.text}</span>
        </div>
      `;
    }).join('');

    return `<div class="arc-paper-board">${slipsHtml}</div>`;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
