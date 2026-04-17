import Component from '../../../core/Component.js';

export default class GlyphNav extends Component {
  constructor(props = {}) {
    super(props);
    // props: { items: [{ icon, label, active? }] }
  }

  async template() {
    const items = this.props.items || [
      { icon: 'home', label: 'Home' },
      { icon: 'map', label: 'Map' },
      { icon: 'backpack', label: 'Bag' },
      { icon: 'user', label: 'Hero' },
      { icon: 'settings', label: 'Gear' },
    ];

    const itemsHtml = items.map(item => {
      const activeClass = item.active ? ' arc-glyph-nav__item--active' : '';
      return `
        <div class="arc-glyph-nav__item${activeClass}">
          <i data-lucide="${item.icon}" style="width:20px;height:20px;"></i>
          <span class="arc-glyph-nav__label">${item.label}</span>
        </div>
      `;
    }).join('');

    return `<div class="arc-glyph-nav">${itemsHtml}</div>`;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
