import Component from '../../../core/Component.js';

/**
 * SideTabRibbon — UI Kit atom
 * A single side-tab ribbon (flag/bookmark style) for recipe book navigation.
 *
 * Props:
 *   id        — unique identifier (string)
 *   label     — short visible text or null (defaults to icon)
 *   icon      — lucide icon name (string, optional)
 *   textLabel — plain text shown instead of icon (e.g. "E")
 *   color     — optional accent color override for the icon
 *   active    — boolean, is this tab currently selected
 *   onClick   — callback(id)
 *   title     — tooltip text
 *   variant   — 'category' | 'health' | 'list-all' | 'clear'
 */
export default class SideTabRibbon extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    const {
      id = '',
      icon = '',
      textLabel = '',
      active = false,
      title = '',
      variant = 'category',
      color = '',
    } = this.props;

    const activeClass = active ? 'active' : '';
    const variantClass = `stb--${variant}`;
    const iconSize = 18;

    let innerHtml = '';
    if (textLabel) {
      innerHtml = `<span class="stb-text-label" ${color ? `style="color:${color}"` : ''}>${textLabel}</span>`;
    } else if (icon) {
      innerHtml = `<i data-lucide="${icon}" style="width:${iconSize}px;height:${iconSize}px;${color ? `color:${color}` : ''}"></i>`;
    } else {
      innerHtml = `<span class="stb-text-label">${id}</span>`;
    }

    return `
      <div class="stb-ribbon ${variantClass} ${activeClass}"
           data-ribbon-id="${id}"
           title="${title}">
        ${innerHtml}
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
    this.element.addEventListener('click', () => {
      if (this.props.onClick) {
        this.props.onClick(this.props.id);
      }
    });
  }
}
