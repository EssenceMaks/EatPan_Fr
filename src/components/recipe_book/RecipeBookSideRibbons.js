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
    return `
      <aside class="stb-grid">
        <div class="stb-grid-inner" id="stb-ribbons-mount"></div>
      </aside>
    `;
  }

  async onMount() {
    const mount = this.$('#stb-ribbons-mount');
    if (!mount) return;

    const categories = this.props.categories || [];
    const healthTabs = this.props.healthTabs || [];
    const activeId = this.props.activeId || null;

    // Calculate layout: how many columns do we need?
    const healthCount = healthTabs.length + 1; // +1 spacer
    const MAX_ROWS = 14;
    const ROW_H = 35;
    const GAP = 6;
    const COL_W = 52;

    // Right column shares space: category slots on top, health on bottom
    const rightColCatSlots = Math.max(MAX_ROWS - healthCount, 3);
    const catCountWithListTab = categories.length + 1; // +1 for "show all"
    
    let numCols = 1;
    if (catCountWithListTab > rightColCatSlots) {
      numCols = 2; // Need 2 columns for categories
    }

    const totalCatSlots = numCols === 2
      ? rightColCatSlots + MAX_ROWS // left col full + right col partial
      : rightColCatSlots;

    const maxRows = MAX_ROWS;

    // Apply grid styles
    mount.style.cssText = `
      grid-template-columns: repeat(${numCols}, ${COL_W}px);
      grid-template-rows: repeat(${maxRows}, ${ROW_H}px);
      gap: ${GAP}px;
    `;

    this._ribbonInstances = [];

    // Place category ribbons: fill rightmost column first, then overflow to left
    let col = numCols;
    let row = 1;
    const visibleCats = categories.slice(0, totalCatSlots - 1); // -1 for list-all tab

    for (const cat of visibleCats) {
      if (col === numCols && row > rightColCatSlots) {
        col--;
        row = 1;
      } else if (col < numCols && row > maxRows) {
        break;
      }

      const ribbon = new SideTabRibbon({
        id: cat.id,
        icon: cat.icon || '',
        active: cat.id === activeId,
        title: cat.label || cat.id,
        variant: 'category',
        onClick: (id) => this._handleSelect(id),
      });
      const el = document.createElement('div');
      el.style.cssText = `grid-column: ${col}; grid-row: ${row};`;
      mount.appendChild(el);
      await ribbon.render(el, 'innerHTML');
      this._ribbonInstances.push(ribbon);
      row++;
    }

    // "Show all" list tab — placed after last category
    if (col === numCols && row > rightColCatSlots) {
      col--;
      row = 1;
    }
    const listAll = new SideTabRibbon({
      id: '__all__',
      icon: 'list',
      active: !activeId || activeId === '__all__',
      title: 'Усі категорії',
      variant: 'list-all',
      onClick: (id) => this._handleSelect(id),
    });
    const listEl = document.createElement('div');
    listEl.style.cssText = `grid-column: ${col}; grid-row: ${row};`;
    mount.appendChild(listEl);
    await listAll.render(listEl, 'innerHTML');
    this._ribbonInstances.push(listAll);

    // Health tabs — always in the rightmost column, from the bottom up
    const healthStartRow = maxRows - healthTabs.length + 1;
    for (let i = 0; i < healthTabs.length; i++) {
      const ht = healthTabs[i];
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
      el.style.cssText = `grid-column: ${numCols}; grid-row: ${healthStartRow + i};`;
      mount.appendChild(el);
      await ribbon.render(el, 'innerHTML');
      this._ribbonInstances.push(ribbon);
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
      let rowH = Math.floor((available - 13 * 6) / 14);
      if (rowH < 22) rowH = 22;
      if (rowH > 35) rowH = 35;
      inner.style.gridTemplateRows = `repeat(14, ${rowH}px)`;
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
