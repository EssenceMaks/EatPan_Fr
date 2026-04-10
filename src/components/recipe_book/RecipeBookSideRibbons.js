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
    await this._buildRibbons();
    this._setupResizeObserver();
  }

  async _buildRibbons() {
    const mount = this.$('#stb-ribbons-mount');
    if (!mount) return;
    mount.innerHTML = '';

    const categories = this.props.categories || [];
    const healthTabs = this.props.healthTabs || [];
    const activeId = this.props.activeId || null;

    const ROW_H = 35;
    const GAP = 6;
    const COL_W = 52;

    // Calculate available rows from container height
    const availableH = this.element.clientHeight || 500;
    let maxRows = Math.floor((availableH + GAP) / (ROW_H + GAP));
    if (maxRows < 5) maxRows = 5;

    // Health tabs always anchor at bottom of rightmost column
    const healthCount = healthTabs.length;
    const healthWithSpacer = healthCount + 1; // +1 invisible spacer

    // Category slots in right column (above health)
    const rightColCatSlots = Math.max(maxRows - healthWithSpacer, 2);

    // Total category items: categories + 1 list-all tab
    const catCountWithList = categories.length + 1;

    // Determine columns
    let numCols = 1;
    if (catCountWithList > rightColCatSlots) {
      numCols = 2;
    }

    // Total available slots for categories
    const totalCatSlots = numCols === 2
      ? rightColCatSlots + maxRows
      : rightColCatSlots;

    // Limit visible categories (always keep 1 slot for list-all)
    const visibleLimit = totalCatSlots - 1;
    const visibleCats = categories.slice(0, visibleLimit);

    // If active category is hidden, swap it in
    if (activeId && !visibleCats.find(c => c.id === activeId)) {
      const hidden = categories.find(c => c.id === activeId);
      if (hidden && visibleCats.length > 0) {
        visibleCats[visibleCats.length - 1] = hidden;
      }
    }

    // Apply grid
    mount.style.cssText = `
      grid-template-columns: repeat(${numCols}, ${COL_W}px);
      grid-template-rows: repeat(${maxRows}, ${ROW_H}px);
      gap: ${GAP}px;
    `;

    this._ribbonInstances = [];

    // Place category ribbons: rightmost col first, then overflow left
    let col = numCols;
    let row = 1;

    for (const cat of visibleCats) {
      if (col === numCols && row > rightColCatSlots) { col--; row = 1; }
      else if (col < numCols && row > maxRows) break;

      const ribbon = new SideTabRibbon({
        id: cat.id, icon: cat.icon || '', active: cat.id === activeId,
        title: cat.label || cat.id, variant: 'category',
        onClick: (id) => this._handleSelect(id),
      });
      const el = document.createElement('div');
      el.style.cssText = `grid-column:${col};grid-row:${row};`;
      mount.appendChild(el);
      await ribbon.render(el, 'innerHTML');
      this._ribbonInstances.push(ribbon);
      row++;
    }

    // "Show all" list tab — always placed after last visible category
    if (col === numCols && row > rightColCatSlots) { col--; row = 1; }
    const listAll = new SideTabRibbon({
      id: '__all__', icon: 'list',
      active: !activeId || activeId === '__all__',
      title: 'Усі категорії', variant: 'list-all',
      onClick: (id) => this._handleSelect(id),
    });
    const listEl = document.createElement('div');
    listEl.style.cssText = `grid-column:${col};grid-row:${row};`;
    mount.appendChild(listEl);
    await listAll.render(listEl, 'innerHTML');
    this._ribbonInstances.push(listAll);

    // Health tabs — anchored at bottom of rightmost column
    const healthStartRow = maxRows - healthCount + 1;
    for (let i = 0; i < healthCount; i++) {
      const ht = healthTabs[i];
      const ribbon = new SideTabRibbon({
        id: ht.id, icon: ht.icon || '', textLabel: ht.textLabel || '',
        color: ht.color || '', active: false,
        title: ht.label || ht.id, variant: 'health',
        onClick: (id) => this._handleHealthClick(id),
      });
      const el = document.createElement('div');
      el.style.cssText = `grid-column:${numCols};grid-row:${healthStartRow + i};`;
      mount.appendChild(el);
      await ribbon.render(el, 'innerHTML');
      this._ribbonInstances.push(ribbon);
    }

    if (window.lucide) window.lucide.createIcons({ root: this.element });
  }

  _setupResizeObserver() {
    let lastH = 0;
    this._resizeObs = new ResizeObserver(() => {
      const h = this.element.clientHeight;
      if (Math.abs(h - lastH) > 30) {
        lastH = h;
        this._buildRibbons();
      }
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
