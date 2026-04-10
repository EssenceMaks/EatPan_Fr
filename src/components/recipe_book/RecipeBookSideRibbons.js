import Component from '../../core/Component.js';
import SideTabRibbon from '../ui_kit/side_tab_ribbon/SideTabRibbon.js';

/**
 * RecipeBookSideRibbons
 * Container that renders the vertical ribbon grid on the left side of the recipe book.
 *
 * Props:
 *   categories    — array of { id, label, icon }
 *   healthTabs    — array of { id, label, icon, textLabel, color }
 *   activeId      — currently active category id (or null)
 *   onSelect      — callback(id) when a ribbon is clicked
 */
export default class RecipeBookSideRibbons extends Component {
  constructor(props = {}) {
    super(props);
    this._ribbonInstances = [];
  }

  async template() {
    const categories = this.props.categories || [];
    const healthTabs = this.props.healthTabs || [];
    const totalItems = categories.length + healthTabs.length + 2; // +1 list-all, +1 spacer
    const maxRows = Math.max(totalItems, 6);

    return `
      <aside class="stb-grid">
        <div class="stb-grid-inner"
             id="stb-ribbons-mount"
             style="
               grid-template-columns: 52px;
               grid-template-rows: repeat(${maxRows}, 35px);
               gap: 6px;
             ">
        </div>
      </aside>
    `;
  }

  async onMount() {
    const mount = this.$('#stb-ribbons-mount');
    if (!mount) return;

    const categories = this.props.categories || [];
    const healthTabs = this.props.healthTabs || [];
    const activeId = this.props.activeId || null;

    let row = 1;
    this._ribbonInstances = [];

    // Render category ribbons
    for (const cat of categories) {
      const ribbon = new SideTabRibbon({
        id: cat.id,
        icon: cat.icon || '',
        textLabel: '',
        active: cat.id === activeId,
        title: cat.label || cat.id,
        variant: 'category',
        onClick: (id) => this._handleSelect(id),
      });
      const el = document.createElement('div');
      el.style.cssText = `grid-column: 1; grid-row: ${row};`;
      mount.appendChild(el);
      await ribbon.render(el, 'innerHTML');
      this._ribbonInstances.push(ribbon);
      row++;
    }

    // "Show all" list tab
    const listAll = new SideTabRibbon({
      id: '__all__',
      icon: 'list',
      active: !activeId || activeId === '__all__',
      title: 'All Categories',
      variant: 'list-all',
      onClick: (id) => this._handleSelect(id),
    });
    const listEl = document.createElement('div');
    listEl.style.cssText = `grid-column: 1; grid-row: ${row};`;
    mount.appendChild(listEl);
    await listAll.render(listEl, 'innerHTML');
    this._ribbonInstances.push(listAll);
    row++;

    // Spacer row
    row++;

    // Health tabs
    for (const ht of healthTabs) {
      const ribbon = new SideTabRibbon({
        id: ht.id,
        icon: ht.icon || '',
        textLabel: ht.textLabel || '',
        color: ht.color || '',
        active: false,
        title: ht.label || ht.id,
        variant: 'health',
        onClick: (id) => this._handleHealthClick(id),
      });
      const el = document.createElement('div');
      el.style.cssText = `grid-column: 1; grid-row: ${row};`;
      mount.appendChild(el);
      await ribbon.render(el, 'innerHTML');
      this._ribbonInstances.push(ribbon);
      row++;
    }

    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }

    this._setupResizeObserver();
  }

  _setupResizeObserver() {
    this._resizeObs = new ResizeObserver(() => {
      const inner = this.$('.stb-grid-inner');
      if (!inner) return;
      const available = this.element.clientHeight;
      const items = this._ribbonInstances.length + 1; // +1 for spacer
      let rowH = Math.floor((available - (items - 1) * 6) / items);
      if (rowH < 24) rowH = 24;
      if (rowH > 35) rowH = 35;
      inner.style.gridTemplateRows = `repeat(${items + 1}, ${rowH}px)`;
    });
    this._resizeObs.observe(this.element);
  }

  _handleSelect(id) {
    if (this.props.onSelect) {
      this.props.onSelect(id === '__all__' ? null : id);
    }
    this._updateActive(id);
  }

  _handleHealthClick(id) {
    // Health tabs can be extended later; for now just toggle visual
    const target = this._ribbonInstances.find(r => r.props.id === id);
    if (target && target.element) {
      const el = target.element.querySelector('.stb-ribbon') || target.element;
      el.classList.toggle('active');
    }
  }

  _updateActive(activeId) {
    this._ribbonInstances.forEach(r => {
      const el = r.element?.querySelector('.stb-ribbon') || r.element;
      if (!el) return;
      if (r.props.id === activeId) {
        el.classList.add('active');
      } else if (r.props.variant !== 'health') {
        el.classList.remove('active');
      }
    });
  }

  onDestroy() {
    if (this._resizeObs) this._resizeObs.disconnect();
  }
}
