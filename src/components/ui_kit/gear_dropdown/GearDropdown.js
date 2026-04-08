import Component from '../../../core/Component.js';

export default class GearDropdown extends Component {
  constructor(props = {}) {
    super(props);
    // props: { placeholder, options: ['Option 1', 'Option 2', ...] }
  }

  async template() {
    const placeholder = this.props.placeholder || 'Выберите...';
    const options = this.props.options || ['Вариант 1', 'Вариант 2', 'Вариант 3'];

    const optionsHtml = options.map(opt => 
      `<div class="arc-gear-dropdown__item">${opt}</div>`
    ).join('');

    return `
      <div class="arc-gear-dropdown">
        <div class="arc-gear-dropdown__trigger">
          <span>${placeholder}</span>
          <div class="arc-gear-dropdown__arrow">
            <i data-lucide="chevron-down" style="width:14px;height:14px;"></i>
          </div>
        </div>
        <div class="arc-gear-dropdown__list">
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
