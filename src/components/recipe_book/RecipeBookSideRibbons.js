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
      <div class="stb-mobile-wrapper">
        <aside class="stb-grid">
          <div class="stb-grid-inner" id="stb-ribbons-mount"></div>
        </aside>
        <div class="stb-pinned-container" id="stb-pinned-mount"></div>
      </div>
    `;
  }

  async onMount() {
    await this._buildRibbons();
    this._setupResizeObserver();
  }

  async _buildRibbons() {
    // Prevent recursive calls from resize observer during rebuild
    if (this._isRebuilding) return;
    this._isRebuilding = true;

    const mount = this.$('#stb-ribbons-mount');
    const pinnedMount = this.$('#stb-pinned-mount');
    if (!mount) {
      this._isRebuilding = false;
      return;
    }
    mount.innerHTML = '';
    if (pinnedMount) pinnedMount.innerHTML = '';

    const categories = this.props.categories || [];
    const healthTabs = this.props.healthTabs || [];
    const activeId = this.props.activeId || null;

    // Mobile detection: window width < 900px
    const isMobile = window.innerWidth < 900;

    // In mobile: scrollable categories in grid, pinned items in separate container
    if (isMobile) {
      mount.style.cssText = '';
      mount.className = 'stb-grid-inner';

      this._ribbonInstances = [];

      // Scrollable: non-active categories + health tabs
      const scrollCats = activeId && activeId !== '__all__'
        ? categories.filter(c => c.id !== activeId)
        : categories;

      for (const cat of scrollCats) {
        const ribbon = new SideTabRibbon({
          id: cat.id, icon: cat.icon || '', active: false,
          title: cat.label || cat.id, variant: 'category',
          onClick: (id) => this._handleSelect(id),
        });
        const el = document.createElement('div');
        mount.appendChild(el);
        await ribbon.render(el, 'innerHTML');
        this._ribbonInstances.push(ribbon);
      }

      // Health tabs in scrollable area
      for (const ht of healthTabs) {
        const ribbon = new SideTabRibbon({
          id: ht.id, icon: ht.icon || '', textLabel: ht.textLabel || '',
          color: ht.color || '', active: false,
          title: ht.label || ht.id, variant: 'health',
          onClick: (id) => this._handleHealthClick(id),
        });
        const el = document.createElement('div');
        mount.appendChild(el);
        await ribbon.render(el, 'innerHTML');
        this._ribbonInstances.push(ribbon);
      }

      // Pinned container: active (if any) + "All categories" only
      if (pinnedMount) {
        // Active category
        if (activeId && activeId !== '__all__') {
          const activeCat = categories.find(c => c.id === activeId);
          if (activeCat) {
            const ribbon = new SideTabRibbon({
              id: activeCat.id, icon: activeCat.icon || '', active: true,
              title: activeCat.label || activeCat.id, variant: 'category',
              onClick: (id) => this._handleSelect(id),
            });
            const el = document.createElement('div');
            pinnedMount.appendChild(el);
            await ribbon.render(el, 'innerHTML');
            this._ribbonInstances.push(ribbon);
          }
        }

        // "All categories" always visible in pinned
        const listAll = new SideTabRibbon({
          id: '__all__', icon: 'list',
          active: !activeId || activeId === '__all__',
          title: 'Усі категорії', variant: 'list-all',
          onClick: (id) => this._handleSelect(id),
        });
        const listEl = document.createElement('div');
        pinnedMount.appendChild(listEl);
        await listAll.render(listEl, 'innerHTML');
        this._ribbonInstances.push(listAll);
      }

      if (window.lucide) window.lucide.createIcons({ root: this.element });
      this._isRebuilding = false;
      return;
    }

    // Desktop: grid-based layout — original calculation from before version
    const ROW_H = 35;
    const GAP = 6;
    const COL_W = 52;

    // Calculate available rows from container height (original formula)
    const availableH = this.element.clientHeight || 500;
    let maxRows = Math.floor((availableH + GAP) / (ROW_H + GAP));
    if (maxRows < 5) maxRows = 5;

    // Health tabs always anchor at bottom of rightmost column
    const healthCount = healthTabs.length;
    const healthWithSpacer = healthCount + 1; // +1 invisible spacer below health tabs

    // Category slots in right column (above health tabs)
    const rightColCatSlots = Math.max(maxRows - healthWithSpacer, 3);

    // Total category items: categories + 1 list-all tab
    const catCountWithList = categories.length + 1;

    // Determine columns: use 2 if categories don't fit in right column
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

    // First: place health tabs at bottom of rightmost column (reserved positions)
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

    // Then: place category ribbons from top
    // Right column: rows 1 to rightColCatSlots (above health tabs)
    // Left column: rows 1 to maxRows (full height)
    let col = numCols;
    let row = 1;

    for (const cat of visibleCats) {
      // In right column: stop when reaching health tabs area
      if (col === numCols && row > rightColCatSlots) {
        col--; // Move to left column
        row = 1; // Start from top of left column
      }
      // In left column: fill all available rows
      if (col < numCols && row > maxRows) break;

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

    // "Show all" list tab — placed after last visible category
    if (col === numCols && row > rightColCatSlots) {
      col--; // Move to left column if right is full
      row = 1;
      // Find first empty row in left column
      while (row <= maxRows && visibleCats.length >= (numCols === 2 ? rightColCatSlots + row : rightColCatSlots)) {
        row++;
      }
    }
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

    if (window.lucide) window.lucide.createIcons({ root: this.element });
    this._isRebuilding = false;
  }

  _setupResizeObserver() {
    let lastH = 0;
    let lastW = window.innerWidth;
    let resizeTimeout = null;

    this._resizeObs = new ResizeObserver(() => {
      // Debounce resize events
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const h = this.element.clientHeight;
        const w = window.innerWidth;
        const isMobileNow = w < 900;
        const wasMobile = lastW < 900;
        // Rebuild on significant height change OR when crossing mobile/desktop breakpoint
        if (Math.abs(h - lastH) > 50 || isMobileNow !== wasMobile) {
          lastH = h;
          lastW = w;
          this._buildRibbons();
        }
      }, 100);
    });
    this._resizeObs.observe(this.element);
  }

  _handleSelect(id) {
    const currentActive = this.props.activeId;
    // If clicking the same category, deselect it (toggle off)
    const newId = (id === currentActive) ? '__all__' : id;

    if (this.props.onSelect) {
      this.props.onSelect(newId === '__all__' ? null : newId);
    }
    // Update props so active state is preserved during resize rebuilds
    this.props.activeId = newId;

    // On mobile, rebuild to move active category to pinned-right
    if (window.innerWidth < 900) {
      this._buildRibbons();
    } else {
      this._updateActive(newId);
    }
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
