/**
 * MealPlanStub — болванка для сектора "Kitchen"
 * 4-column drag and drop Meal Planner with localized Ukrainian UI
 */
import Component from '../../core/Component.js';
import { MealPlanService, RecipeService, ShoppingService } from '../../core/ApiClient.js';
import { resolveMediaUrl } from '../../core/mediaResolver.js';

const DAYS_OF_WEEK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
const SHORT_DAYS = {
  'Понеділок': 'ПН', 'Вівторок': 'ВТ', 'Середа': 'СР', 'Четвер': 'ЧТ',
  'П\'ятниця': 'ПТ', 'Субота': 'СБ', 'Неділя': 'НД'
};

const MEAL_TYPES_MAP = {
  'breakfast': 'Сніданок',
  'lunch': 'Обід',
  'dinner': 'Вечеря',
  'snack': 'Перекус',
  'other & drinks': 'Інше та напої'
};
const MEAL_TYPES = Object.keys(MEAL_TYPES_MAP);

const FOOD_ICONS = [
  'apple', 'beef', 'fish', 'carrot', 'milk', 'croissant', 'package', 'cup-soda',
  'cookie', 'candy', 'coffee', 'pizza', 'salad', 'sandwich', 'soup', 'cake',
  'egg', 'nut', 'cherry', 'grape', 'citrus', 'cheese', 'drumstick', 'popcorn', 'wheat', 'leaf', 'utensils'
];

const THEME_PALETTE = {
  FOCUS: ['#5c82ab', '#6b95c1', '#8eb0d4', '#b3d0ee'],
  HEALTH: ['#498371', '#5e9d89', '#7abfa8', '#9ad8c3'],
  ACTION: ['#c09953', '#c55f53', '#de8e61', '#ebad76'],
  REST: ['#8b52b3', '#aa70d1', '#c796e6', '#dcb5f2']
};

export default class MealPlanStub extends Component {
  constructor(props = {}) {
    super(props);
    this.chips = [];
    this.chipMeta = JSON.parse(localStorage.getItem('eatpan_chip_meta') || '{}');
    this.schedule = {};
    this.recipes = {};
    this.shoppingListObj = null;
    this.shoppingList = [];
    this.checkedIngs = JSON.parse(localStorage.getItem('eatpan_checked_ings') || '{}');
    this.expandedReqs = {}; // Tracks which meal's ingredient list is expanded

    this.viewModeChips = localStorage.getItem('eatpan_view_chips') || 'image';
    this.viewModeSchedule = localStorage.getItem('eatpan_view_schedule') || 'image';
    this._renderTimer = null; // debounce timer


    this._error = null;
    this.currentWeekDates = this._getCurrentWeekDates();

    this.isIconDropdownOpen = false;
    this.recipeModalOpen = false;
    this.activeEntryForRecipe = null;
    this.allRecipes = [];

    this.editingChip = null;
    this.editChipIconOpen = false;

    this.popupPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  _getCurrentWeekDates() {
    const dates = {};
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      dates[DAYS_OF_WEEK[i]] = d.toISOString().split('T')[0];
    }
    return dates;
  }

  async template() {
    return `
      <div class="mealplanner-root" style="position:relative; padding:8px; height:100%; overflow-x:auto; overflow-y:auto; font-family:var(--font-body, 'EB Garamond', serif); background: radial-gradient(circle at center, var(--parchment-light, #f8f1e3) 0%, var(--parchment-dark, #e6d3b3) 120%); color: var(--c-ink-primary, #2c1b18); box-sizing: border-box; display: flex; flex-direction: column;">

        <div style="display:flex;justify-content:center;align-items:center;margin-bottom:6px; border-bottom: 2px solid rgba(26,15,4,0.2); padding-bottom: 12px; flex-shrink: 0; position:relative;">
          <h2 style="font-family:var(--font-title, 'Cinzel', serif);color:#1a0f04;font-size:2rem;margin:0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
            Планувальник та Моя Кухня
          </h2>
          <button class="stub-btn" data-action="refresh" style="position:absolute; right:0; background:var(--c-ink-primary); color:var(--bg-parchment); border:1px solid var(--c-accent-gold); padding:8px 16px; font-family:var(--font-title); border-radius:6px; cursor:pointer; font-size: 1rem; transition: opacity 0.2s;">
            <i data-lucide="refresh-cw" style="width:16px;height:16px; vertical-align: middle; margin-right: 4px;"></i> Оновити
          </button>
        </div>

        <div class="mp-grid" id="mealplan-content">
          <div style="text-align:center; font-style:italic; padding: 40px; color: var(--c-ink-light); grid-column: 1 / -1; font-size: 1.2rem;">Завантаження...</div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });

    // Event Delegation
    this.element.addEventListener('click', (e) => this._handleAction(e));
    this.element.addEventListener('dragstart', this._handleDragStart.bind(this));
    this.element.addEventListener('dragover', this._handleDragOver.bind(this));
    this.element.addEventListener('dragleave', this._handleDragLeave.bind(this));
    this.element.addEventListener('drop', this._handleDrop.bind(this));

    // Auto-save events
    this.element.addEventListener('change', (e) => {
      if (e.target.matches('#edit-chip-name') || e.target.matches('#edit-chip-color')) {
        this._autoSaveChip();
      }
    });

    this.element.addEventListener('input', (e) => {
      if (e.target.matches('#edit-chip-name')) {
        this._autoSaveChip(); // Real-time save
      }
    });

    await this._loadData();
  }

  async _loadData() {
    try {
      const labelsRes = await MealPlanService.fetchLabels();
      this.chips = Object.entries(labelsRes?.labels || {}).map(([id, l]) => ({ id, ...l }));

      const mpRes = await MealPlanService.fetchAll();
      const entries = Object.entries(mpRes?.entries || {}).map(([id, e]) => ({ id, ...e }));

      const recRes = await RecipeService.fetchAll({ limit: 500 });
      this.allRecipes = Array.isArray(recRes) ? recRes : [];

      this.schedule = {};
      entries.forEach(e => {
        if (!this.schedule[e.date]) this.schedule[e.date] = {};
        if (!this.schedule[e.date][e.meal_type]) this.schedule[e.date][e.meal_type] = [];
        this.schedule[e.date][e.meal_type].push(e);
      });

      // ARCH-2 FIX: Use allRecipes cache first, only fetch detail if truly needed
      for (const e of entries) {
        if (e.recipe_uuid && !this.recipes[e.recipe_uuid]) {
          // Check if lightweight data is already available from allRecipes
          const cached = this.allRecipes.find(r => r.uuid === e.recipe_uuid);
          if (cached) {
            this.recipes[e.recipe_uuid] = cached;
          } else {
            try {
              const detail = await RecipeService.fetchDetail(e.recipe_uuid);
              if (detail) this.recipes[e.recipe_uuid] = detail;
            } catch (err) {
              // Silently skip — recipe may have been deleted
            }
          }
        }
      }

      // Fetch Shopping List from API
      const shoppingRes = await ShoppingService.fetchAll();
      const listsRaw = shoppingRes?.results || shoppingRes || [];
      const lists = Array.isArray(listsRaw) ? listsRaw : [];
      this.shoppingListObj = lists.find(l => l.name === 'Meal Planner');
      if (!this.shoppingListObj) {
        this.shoppingListObj = await ShoppingService.createList({ name: 'Meal Planner', color: '#b8860b' });
      }
      const itemsRaw = this.shoppingListObj?.items;
      this.shoppingList = Array.isArray(itemsRaw) ? itemsRaw : [];

      this._error = null;
    } catch (err) {
      this._error = err.message || 'Помилка завантаження даних';
      console.error(err);
    }
    this._render();
  }

  _render() {
    // Debounce: if multiple _render() calls happen in same frame, only execute once
    if (this._renderTimer) cancelAnimationFrame(this._renderTimer);
    this._renderTimer = requestAnimationFrame(() => {
      this._renderTimer = null;
      const el = this.$('#mealplan-content');
      if (!el) return;
      el.innerHTML = this._buildContentHTML();
      if (window.lucide) {
        lucide.createIcons({ root: el });
        if (this.isIconDropdownOpen) lucide.createIcons({ root: this.$('#icon-dropdown-container') });
        if (this.editChipIconOpen) lucide.createIcons({ root: this.$('#edit-icon-dropdown-container') });
      }
    });
  }

  _renderScheduleItem(m) {
    const mMeta = this.chipMeta[m.notes] || {};
    const mIcon = mMeta.icon || 'utensils';
    const hasRecipe = !!m.recipe_uuid;
    const rImg = hasRecipe ? this._getRecipeImageUrl(m.recipe_uuid) : null;
    const originalName = m.recipe_title || 'Без назви';
    const boundTitle = mMeta.recipe_title || null;

    // Determine the main display name (the custom chip name) vs the bound recipe title
    let mainName = originalName;
    let subName = '';

    if (boundTitle && boundTitle !== originalName) {
      mainName = originalName;
      subName = boundTitle;
    } else if (boundTitle) {
      mainName = boundTitle;
    }

    return `
      <div class="meal-item ${this.viewModeSchedule === 'text' ? 'mode-text' : ''}" draggable="true" data-drag-type="schedule-item" data-id="${m.id}">
        <div class="meal-item-header">
          <span style="display:flex;align-items:center;gap:6px;">
            <i data-lucide="${mIcon}" style="width:14px;height:14px;opacity:0.7;"></i>
            ${mainName}
          </span>
          <button data-action="delete-schedule" data-id="${m.id}" style="background:none;border:none;color:#991b1b;cursor:pointer;padding:2px;"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
        </div>
        ${rImg ? `
          <div class="meal-img-wrapper">
            <img src="${rImg}" onerror="this.style.display='none'" />
          </div>
        ` : ''}
        ${subName ? `<div style="font-size: 0.7rem; opacity: 0.7; text-align:center; padding-top:4px; font-style:italic;">${subName}</div>` : ''}
        ${!hasRecipe ? `
          <div style="margin-top:6px;">
            <button data-action="open-recipe-modal" data-id="${m.id}" style="width:100%;font-size:0.7rem;padding:2px;border:1px dashed rgba(0,0,0,0.2);background:transparent;cursor:pointer;border-radius:4px;opacity:0.7;">
              <i data-lucide="book-open" style="width:10px;height:10px;margin-right:4px;"></i>Прив'язати
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  _saveChipMeta() {
    localStorage.setItem('eatpan_chip_meta', JSON.stringify(this.chipMeta));
  }

  _saveShoppingList() {
    localStorage.setItem('eatpan_shopping_list', JSON.stringify(this.shoppingList));
  }

  _saveCheckedIngs() {
    localStorage.setItem('eatpan_checked_ings', JSON.stringify(this.checkedIngs));
  }

  _getRecipeImageUrl(uuid) {
    const rData = this.recipes[uuid] || this.allRecipes.find(r => r.uuid === uuid);
    if (!rData) return null;
    const data = rData.data || rData;

    if (rData.image_uuid) return resolveMediaUrl(rData.image_uuid);

    if (data.media?.images?.length > 0) {
      const imgPath = data.media.images[0];
      if (imgPath && String(imgPath).startsWith('http')) return imgPath;

      if (Array.isArray(rData.media_assets)) {
        const asset = rData.media_assets.find(a => a.uuid === imgPath);
        if (asset && asset.url) {
          return resolveMediaUrl(asset.url);
        }
      }
      return resolveMediaUrl(imgPath);
    }
    if (data.image) return resolveMediaUrl(data.image);
    return null;
  }

  _calculatePopupPosition() {
    let styles = '';
    const margin = 20;

    if (this.popupPos.x > window.innerWidth / 2) {
      const right = Math.max(margin, window.innerWidth - this.popupPos.x);
      styles += `right: ${right}px; max-width: ${window.innerWidth - right - margin}px; `;
    } else {
      const left = this.popupPos.x + margin;
      styles += `left: ${left}px; max-width: ${window.innerWidth - left - margin}px; `;
    }

    if (this.popupPos.y > window.innerHeight / 2) {
      const bottom = Math.max(margin, window.innerHeight - this.popupPos.y);
      styles += `bottom: ${bottom}px; max-height: ${window.innerHeight - bottom - margin}px; `;
    } else {
      const top = this.popupPos.y + margin;
      styles += `top: ${top}px; max-height: ${window.innerHeight - top - margin}px; `;
    }
    return styles;
  }

  _buildContentHTML() {
    if (this._error) return `<div style="color:red; grid-column: 1 / -1; text-align: center; font-size: 1.2rem;">${this._error}</div>`;

    const inStockChips = this.chips.filter(c => this.chipMeta[c.id]?.inStock !== false);
    const outStockChips = this.chips.filter(c => this.chipMeta[c.id]?.inStock === false);

    const requiredItems = [];
    Object.values(this.schedule).forEach(day => {
      Object.values(day).forEach(meals => {
        meals.forEach(m => {
          const meta = this.chipMeta[m.notes];
          const inStock = meta ? meta.inStock : false;
          const labelName = m.recipe_title || 'Страва без назви';
          const icon = meta?.icon || 'utensils';

          let ingredients = [];
          if (m.recipe_uuid && (this.recipes[m.recipe_uuid] || this.allRecipes.find(r => r.uuid === m.recipe_uuid))) {
            const rData = this.recipes[m.recipe_uuid] || this.allRecipes.find(r => r.uuid === m.recipe_uuid);
            if (rData.data && rData.data.ingredients) {
              ingredients = rData.data.ingredients.map(i => typeof i === 'string' ? i : (i.name || i.item || 'Невідомий інгредієнт'));
            }
          }

          if (ingredients.length > 0) {
            requiredItems.push({ id: m.id, name: labelName, icon, inStock, ingredients, color: meta?.color });
          }
        });
      });
    });

    const hexToRgba = (hex, alpha) => {
      if (!hex || !hex.startsWith('#')) return 'rgba(0,0,0,0.02)';
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    return `
      <div class="mp-col">
        <div class="mp-col-header">
          <span>Що ми маємо та їмо</span>
          <button class="mp-view-toggle ${this.viewModeChips === 'image' ? 'active' : ''}" data-action="toggle-view-chips" title="${this.viewModeChips === 'image' ? 'Сховати фото' : 'Показати фото'}">
            <i data-lucide="${this.viewModeChips === 'image' ? 'image' : 'image-off'}" style="width:14px;height:14px;"></i>
          </button>
        </div>
        <div class="mp-col-body">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="background: rgba(220, 252, 231, 0.6); padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); font-weight: bold; font-size: 0.95rem; display:flex; justify-content: space-between; align-items:center; color: #166534;">
              <span style="display:flex; align-items:center; gap:6px;"><i data-lucide="package-check" style="width:18px;height:18px;"></i> В НАЯВНОСТІ</span>
              <button data-action="toggle-add-chip" data-target="in" style="background:white;border:1px solid #bbf7d0;border-radius:4px;cursor:pointer;padding:4px;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:transform 0.1s;"><i data-lucide="plus" style="width:16px;height:16px;color:#166534;"></i></button>
            </div>
            ${this._renderAddChipForm('in')}
            <div class="dropzone" data-drop-type="chip-in" style="flex:1; padding: 12px; display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; align-items: flex-start;">
              ${inStockChips.map(c => this._renderChip(c, true)).join('')}
              ${inStockChips.length === 0 ? '<div style="opacity:0.5; font-size:0.9rem; width:100%; text-align:center; padding-top:10px;">Натисніть +, щоб додати страви</div>' : ''}
            </div>
          </div>
          
          <div style="height: 2px; background: var(--c-ink-light);"></div>
          
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="background: rgba(254, 226, 226, 0.6); padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); font-weight: bold; font-size: 0.95rem; display:flex; justify-content: space-between; align-items:center; color: #991b1b;">
              <span style="display:flex; align-items:center; gap:6px;"><i data-lucide="package-x" style="width:18px;height:18px;"></i> Треба готувати</span>
              <button data-action="toggle-add-chip" data-target="out" style="background:white;border:1px solid #fecaca;border-radius:4px;cursor:pointer;padding:4px;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:transform 0.1s;"><i data-lucide="plus" style="width:16px;height:16px;color:#991b1b;"></i></button>
            </div>
            ${this._renderAddChipForm('out')}
            <div class="dropzone" data-drop-type="chip-out" style="flex:1; padding: 12px; display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; align-items: flex-start;">
              ${outStockChips.map(c => this._renderChip(c, false)).join('')}
              ${outStockChips.length === 0 ? '<div style="opacity:0.5; font-size:0.9rem; width:100%; text-align:center; padding-top:10px;">Натисніть +, щоб додати страви</div>' : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="mp-col">
        <div class="mp-col-header" style="justify-content:center; position:relative;">
          <span style="flex:1; text-align:center;">Тижневий план</span>
          <button class="mp-view-toggle ${this.viewModeSchedule === 'image' ? 'active' : ''}" data-action="toggle-view-schedule" style="position:absolute; right:16px; top:50%; transform:translateY(-50%);" title="${this.viewModeSchedule === 'image' ? 'Сховати фото' : 'Показати фото'}">
            <i data-lucide="${this.viewModeSchedule === 'image' ? 'image' : 'image-off'}" style="width:14px;height:14px;"></i>
          </button>
        </div>
        <div class="mp-col-body">
          ${DAYS_OF_WEEK.map(day => {
      const date = this.currentWeekDates[day];
      const dayMeals = this.schedule[date] || {};
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = date === todayStr;

      const shortDay = SHORT_DAYS[day];
      const formatObj = new Date(date);
      const dateStr = `${String(formatObj.getDate()).padStart(2, '0')}.${String(formatObj.getMonth() + 1).padStart(2, '0')}`;

      return `
              <div class="schedule-day" style="${isToday ? 'border-color: var(--c-accent-gold); box-shadow: 0 0 0 1px var(--c-accent-gold);' : ''}">
                <div class="day-header">
                  <span>${shortDay} <span style="font-size:0.8rem;opacity:0.6;">(${dateStr})</span> ${isToday ? '<span style="font-size:0.7rem;opacity:0.5;margin-left:4px;">СЬОГОДНІ</span>' : ''}</span>
                </div>
                
                <div class="day-grid-cols">
                  ${['breakfast', 'lunch', 'snack', 'dinner'].map(type => `
                    <div class="meal-col dropzone" data-drop-type="schedule" data-date="${date}" data-type="${type}">
                      <div class="meal-col-header">${MEAL_TYPES_MAP[type]}</div>
                      <div class="meal-content">
                        ${(dayMeals[type] || []).map(m => this._renderScheduleItem(m)).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <div class="meal-slot dropzone" data-drop-type="schedule" data-date="${date}" data-type="other & drinks" style="min-height: 40px; border-bottom:none;">
                  <div class="meal-name" style="border-right: none;">${MEAL_TYPES_MAP['other & drinks']}</div>
                  <div class="meal-content" style="flex-direction:row; align-items:flex-start; padding-left:0;">
                    ${(dayMeals['other & drinks'] || []).map(m => this._renderScheduleItem(m)).join('')}
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>

      <div class="mp-col">
        <div class="mp-col-header" style="justify-content:center;">Потрібно для страв</div>
        
        <div style="background: rgba(255,255,255,0.5); padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); display:flex; justify-content: space-between; align-items:center;">
          <span style="font-size:0.85rem; opacity:0.7; font-weight:bold; font-family:var(--font-title);">ІНГРЕДІЄНТИ</span>
          <button data-action="add-all-missing-to-shopping" style="background:white; border:1px solid var(--c-accent-gold); color:var(--c-accent-gold); border-radius:4px; padding:4px 8px; font-size:0.85rem; font-family:var(--font-title); font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.background='var(--c-accent-gold)'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='var(--c-accent-gold)'">
            <i data-lucide="shopping-basket" style="width:16px;height:16px;"></i> Всі відсутні
          </button>
        </div>

        <div class="mp-col-body" style="background: rgba(255,255,255,0.2);">
          ${requiredItems.length === 0 ? `
            <div style="opacity:0.5;text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;">
              <i data-lucide="shopping-basket" style="width:48px;height:48px;opacity:0.5;"></i>
              Немає страв або всі страви в наявності.
            </div>` : ''}
          ${requiredItems.map(req => {
      const total = req.ingredients.length;
      const checked = this.checkedIngs[req.id] || [];
      const have = checked.length;

      const isExpanded = !!this.expandedReqs[req.id];
      const displayIngs = isExpanded ? req.ingredients : req.ingredients.slice(0, 3);
      const hiddenCount = total - displayIngs.length;

      const bgColor = hexToRgba(req.color, 0.15) || 'rgba(0,0,0,0.03)';

      return `
            <div style="margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 12px; background: ${bgColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div class="chip ${req.inStock ? 'in-stock' : 'greyed'}" style="margin-bottom: 8px; border:none; box-shadow:none; cursor:default; font-size: 1rem; flex-direction:row; width: 100%; background: rgba(255,255,255,0.5);">
                <span style="display:flex; align-items:center; gap:6px; flex:1;">
                  <i data-lucide="${req.icon}" style="width:18px;height:18px;"></i> ${req.name}
                </span>
                ${total > 0 ? `<span style="font-family:var(--font-body); font-weight:bold; font-size:1rem; opacity:0.8;">${have}/${total}</span>` : ''}
              </div>
              
              ${total > 0 ? `
                <div class="ing-list">
                  ${displayIngs.map((ing, i) => {
        const isChecked = checked.includes(ing);
        const inShopping = this.shoppingList.find(s => s.name === ing);
        const arrowColor = inShopping ? '#16a34a' : 'var(--c-accent-gold)';

        return `
                    <div class="ing-item" draggable="true" data-drag-type="ingredient" data-name="${ing}" data-meal="${req.name}" style="color: ${isChecked ? '#166534' : 'inherit'}; border-color: rgba(0,0,0,0.05); background: rgba(255,255,255,0.4);">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <button data-action="toggle-ing-checkbox" data-meal-id="${req.id}" data-ing="${ing}" style="background:none; border:none; padding:0; cursor:pointer; color: ${isChecked ? '#166534' : 'rgba(0,0,0,0.3)'}; transition: transform 0.1s;">
                          <i data-lucide="${isChecked ? 'check-square' : 'square'}" style="width:18px;height:18px;"></i>
                        </button>
                        <span style="cursor:grab; font-weight:normal; text-shadow: none;">${ing}</span>
                      </div>
                      
                      <button class="ing-arrow-btn ${isChecked ? 'hide-unless-hover' : ''}" data-action="add-to-shopping" data-ing="${ing}" data-meal="${req.name}" style="background:none; border:none; color:${arrowColor}; cursor:pointer; padding:4px; opacity: ${inShopping ? '1' : (isChecked ? '0' : '0.6')}; transition: opacity 0.2s;" title="${inShopping ? 'Вже у кошику (додати ще)' : 'Додати в кошик'}">
                        <i data-lucide="${inShopping ? 'check-circle-2' : 'arrow-right-circle'}" style="width:16px;height:16px; ${inShopping ? 'fill: rgba(22,163,74,0.1);' : ''}"></i>
                      </button>
                    </div>
                  `}).join('')}
                </div>
                ${hiddenCount > 0 ? `
                  <button data-action="toggle-expand-req" data-id="${req.id}" style="background:none; border:none; color:var(--c-accent-gold); cursor:pointer; font-size:0.85rem; font-family:var(--font-title); margin-top:8px; font-weight:bold; text-align:left; padding:4px;">
                    Показати ще ${hiddenCount}...
                  </button>
                ` : isExpanded && total > 3 ? `
                  <button data-action="toggle-expand-req" data-id="${req.id}" style="background:none; border:none; color:var(--c-accent-gold); cursor:pointer; font-size:0.85rem; font-family:var(--font-title); margin-top:8px; font-weight:bold; text-align:left; padding:4px;">
                    Згорнути
                  </button>
                ` : ''}
              ` : `
                <div style="font-size:0.85rem;opacity:0.6;padding-left:12px;display:flex;align-items:center;gap:6px;">
                  <i data-lucide="info" style="width:14px;height:14px;"></i> Рецепт не прив'язано.
                </div>
              `}
            </div>
          `}).join('')}
        </div>
      </div>

      <div class="mp-col">
        <div class="mp-col-header" style="justify-content:center; position:relative;">
          <span style="flex:1; text-align:left;">Список покупок</span>
          <div style="display:flex; gap:4px; position:absolute; right:16px; top:50%; transform:translateY(-50%);">
            <button data-action="create-shopping-list" style="background:#1a0f04; color:#f8f1e3; border:none; border-radius:4px; padding:2px 10px; font-size:0.8rem; cursor:pointer; font-family:var(--font-title); font-weight:bold;" title="Створити список та відправити в сектор Списки">
              <i data-lucide="list-plus" style="width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i> Створити
            </button>
            <button data-action="clear-shopping" style="background:none; border:1px solid rgba(153,27,27,0.3); color:#991b1b; border-radius:4px; padding:2px 8px; font-size:0.8rem; cursor:pointer;" title="Очистити список">Очистити</button>
          </div>
        </div>
        <div class="mp-col-body dropzone" data-drop-type="shopping" style="background: rgba(255,255,255,0.2);">
          ${this.shoppingList.length === 0 ? '<div style="opacity:0.5;text-align:center;padding-top:40px;">Перетягніть сюди інгредієнти</div>' : ''}
          <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
            ${this.shoppingList.map((item, i) => `
              <li class="shopping-row" style="display:flex; justify-content:space-between; align-items:center; background: white; padding: 10px 14px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05);">
                <div style="display:flex; flex-direction:column; gap:2px;">
                  <span style="font-size: 1rem; font-family: var(--font-body); font-weight: 500;">${item.name}</span>
                  ${item.notes ? `<span style="font-size:0.75rem; opacity:0.6; font-family:var(--font-title);">(для ${item.notes})</span>` : ''}
                </div>
                <button class="shopping-trash" data-action="remove-shopping" data-idx="${i}" style="background:none;border:none;color:#991b1b;cursor:pointer;padding:4px;border-radius:4px;transition:all 0.2s;" onmouseover="this.style.background='rgba(254,226,226,1)'" onmouseout="this.style.background='transparent'">
                  <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                </button>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      ${(this.recipeModalOpen || this.editingChip) ? `<div style="position:fixed; inset:0; z-index:999; cursor:default;" data-action="close-all-modals"></div>` : ''}
      
      ${this._renderRecipeModal()}
      ${this._renderChipEditModal()}
    `;
  }

  _renderAddChipForm(target) {
    if (this.showAddChip !== target) return '';
    return `
      <div style="padding: 12px; background: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; gap: 8px; position:relative; align-items:center;">
        <div style="position:relative;">
          <button data-action="toggle-icon-dropdown" style="width:36px;height:36px;border:1px solid var(--c-ink-light);border-radius:6px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
            <i data-lucide="${this.selectedIcon || 'utensils'}" style="width:20px;height:20px;"></i>
          </button>
          ${this.isIconDropdownOpen ? `
            <div id="icon-dropdown-container" class="icon-dropdown" style="top: 42px; left: 0;">
              ${FOOD_ICONS.map(i => `<div class="icon-option" data-action="select-icon" data-icon="${i}"><i data-lucide="${i}" style="width:24px;height:24px;"></i></div>`).join('')}
            </div>
          ` : ''}
        </div>
        <div style="position: relative; flex: 1;">
          <input type="text" id="new-chip-name" placeholder="Назва страви..." style="width:100%; border:1px solid var(--c-ink-light); border-radius:6px; padding:8px 80px 8px 12px; font-family:var(--font-body); font-size:1rem; outline:none; box-sizing:border-box;" autofocus>
          <button data-action="save-chip" data-stock="${target === 'in'}" style="position:absolute; right:4px; top:4px; bottom:4px; background:var(--c-ink-primary);color:var(--bg-parchment);border:none;border-radius:4px;padding:0 12px;cursor:pointer;font-family:var(--font-title);font-weight:bold;">Додати</button>
        </div>
      </div>
    `;
  }

  _renderChip(chip, inStock) {
    const meta = this.chipMeta[chip.id] || {};
    const icon = meta.icon || 'utensils';
    const color = meta.color || '';
    const cssClass = inStock ? 'in-stock' : 'out-stock';
    const customStyle = color ? `background-color: ${color}; border-color: rgba(0,0,0,0.1);` : '';

    let rImg = null;
    if (meta.recipe_uuid) rImg = this._getRecipeImageUrl(meta.recipe_uuid);

    return `
      <div class="chip ${cssClass}" style="${customStyle}" draggable="true" data-drag-type="chip" data-id="${chip.id}" data-name="${chip.name}" data-action="edit-chip">
        <div style="display:flex; align-items:center; gap:6px; width:100%;">
          <i data-lucide="${icon}" style="width:16px;height:16px;"></i>
          <span>${chip.name}</span>
        </div>
        ${rImg ? `<img src="${rImg}" style="width:100%; height:48px; object-fit:cover; border-radius:6px; margin-top:6px;" onerror="this.style.display='none'" />` : ''}
      </div>
    `;
  }

  _renderRecipeModal() {
    if (!this.recipeModalOpen || !this.activeEntryForRecipe) return '';

    const byCat = {};
    this.allRecipes.forEach(r => {
      const cat = r.data?.category || r.category || 'Без категорії';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(r);
    });

    return `
      <div class="arc-popup-block" style="${this._calculatePopupPosition()}">
        <div class="arc-corner arc-corner--tl"></div>
        <div class="arc-corner arc-corner--tr"></div>
        <div class="arc-corner arc-corner--bl"></div>
        <div class="arc-corner arc-corner--br"></div>
        
        <div style="flex:1; overflow-y:auto; padding-right:4px;">
          <h3 style="margin-top:0; border-bottom:2px solid rgba(0,0,0,0.1); padding-bottom:12px; font-family:var(--font-title); color:#1a0f04; font-size:1.3rem; display:flex; align-items:center; justify-content:center; gap:8px;">
            <i data-lucide="book-open" style="width:20px;height:20px;"></i> ПРИВ'ЯЗАТИ РЕЦЕПТ
          </h3>
          
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:16px;">
            ${this.allRecipes.length === 0 ? '<div style="opacity:0.5; font-style:italic; text-align:center;">Рецепти не знайдено.</div>' : ''}
            
            ${Object.keys(byCat).sort().map(cat => `
              <details class="recipe-category-acc" style="border: 1px solid rgba(0,0,0,0.2); border-radius: 4px; background: rgba(255,255,255,0.2);">
                <summary style="padding:12px; font-family:var(--font-title); font-size:1rem; font-weight:bold; cursor:pointer; background:rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center;">
                  ${cat} <span style="opacity:0.6; font-size:0.85rem;">(${byCat[cat].length})</span>
                </summary>
                <div style="padding: 8px; display:flex; flex-direction:column; gap:4px; border-top: 1px solid rgba(0,0,0,0.1);">
                  ${byCat[cat].map(r => `
                    <button data-action="bind-recipe" data-recipe-uuid="${r.uuid}" data-recipe-title="${r.data?.title || r.title}" style="text-align:left; padding:10px; background:rgba(255,255,255,0.4); border:1px solid rgba(0,0,0,0.1); border-radius:4px; cursor:pointer; font-family:var(--font-body); font-size:0.95rem; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.7)'" onmouseout="this.style.background='rgba(255,255,255,0.4)'">
                      <i data-lucide="chef-hat" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;opacity:0.7;"></i>
                      ${r.data?.title || r.title || 'Рецепт без назви'}
                    </button>
                  `).join('')}
                </div>
              </details>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderChipEditModal() {
    if (!this.editingChip) return '';
    const chip = this.chips.find(c => c.id === this.editingChip);
    if (!chip) return '';

    const meta = this.chipMeta[chip.id] || {};
    const icon = meta.icon || 'utensils';
    const color = meta.color || '#ffffff';
    const hasRecipe = !!meta.recipe_uuid;

    return `
      <div class="arc-popup-block" style="${this._calculatePopupPosition()} width: 340px;">
        <div class="arc-corner arc-corner--tl"></div>
        <div class="arc-corner arc-corner--tr"></div>
        <div class="arc-corner arc-corner--bl"></div>
        <div class="arc-corner arc-corner--br"></div>

        <h3 style="margin-top:0; border-bottom:2px solid rgba(0,0,0,0.1); padding-bottom:12px; font-family:var(--font-title); color:#1a0f04; font-size:1.3rem; text-align:center;">
          РЕДАГУВАТИ СТРАВУ
        </h3>
        
        <div style="display:flex; justify-content:flex-end; margin-bottom: 0px; margin-top: 8px;">
          <button data-action="delete-chip" style="background:none; color:#991b1b; border:none; border-bottom:1px solid #991b1b; padding:0 2px; font-size:0.8rem; cursor:pointer; font-weight:bold; font-family:var(--font-title);" title="Видалити">ВИДАЛИТИ СТРАВУ</button>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
          <div>
            <label style="display:block; font-size:0.85rem; font-family:var(--font-title); font-weight:bold; margin-bottom:6px; color:#2b1a08;">Назва:</label>
            <input type="text" id="edit-chip-name" value="${chip.name}" class="arc-popup-input">
          </div>
          
          <div style="display:flex; gap:16px;">
            <div style="position:relative;">
              <label style="display:block; font-size:0.85rem; font-family:var(--font-title); font-weight:bold; margin-bottom:6px; color:#2b1a08;">Іконка:</label>
              <button data-action="toggle-edit-icon-dropdown" style="width:44px;height:44px;background:rgba(255,255,255,0.4);border:1px solid rgba(0,0,0,0.3);border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">
                <i data-lucide="${icon}" style="width:24px;height:24px;"></i>
              </button>
              ${this.editChipIconOpen ? `
                <div id="edit-icon-dropdown-container" class="icon-dropdown" style="top: 72px; left: 0;">
                  ${FOOD_ICONS.map(i => `<div class="icon-option" data-action="select-edit-icon" data-icon="${i}"><i data-lucide="${i}" style="width:24px;height:24px;"></i></div>`).join('')}
                </div>
              ` : ''}
            </div>
            
            <div style="flex:1;">
              <label style="display:block; font-size:0.85rem; font-family:var(--font-title); font-weight:bold; margin-bottom:6px; color:#2b1a08;">Колір фону:</label>
              
              <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.4); border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; padding: 12px;">
                ${Object.entries(THEME_PALETTE).map(([category, colors]) => `
                  <div style="display:flex; align-items:center; gap: 12px;">
                    <span style="font-family:var(--font-title); font-size:0.75rem; font-weight:bold; color:rgba(0,0,0,0.5); width:50px;">${category}</span>
                    <div style="display:flex; gap:8px;">
                      ${colors.map(c => `<button data-action="set-chip-color" data-color="${c}" style="width:24px; height:24px; border-radius:50%; background-color:${c}; border:2px solid ${color === c ? 'var(--c-ink-primary)' : 'transparent'}; cursor:pointer; box-shadow:inset 0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1); transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'"></button>`).join('')}
                    </div>
                  </div>
                `).join('')}
                <div style="display:flex; align-items:center; gap: 12px; margin-top: 4px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.1);">
                  <span style="font-family:var(--font-title); font-size:0.75rem; font-weight:bold; color:rgba(0,0,0,0.5); width:50px;">CUSTOM</span>
                  <input type="color" id="edit-chip-color" value="${color}" style="width:28px; height:28px; border:1px solid rgba(0,0,0,0.2); padding:0; background:none; cursor:pointer; border-radius:4px; box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);">
                </div>
              </div>
            </div>
          </div>

          <div>
            <label style="display:block; font-size:0.85rem; font-family:var(--font-title); font-weight:bold; margin-bottom:6px; color:#2b1a08;">Рецепт:</label>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="arc-popup-input" style="flex:1; cursor:default; background:rgba(0,0,0,0.03); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${hasRecipe ? (meta.recipe_title || 'Прив\'язано') : 'Немає'}
              </span>
              ${hasRecipe ? `
                <button data-action="unbind-chip-recipe" style="background:rgba(153,27,27,0.1); color:#991b1b; border:1px solid rgba(153,27,27,0.3); border-radius:4px; padding:0 12px; height:44px; cursor:pointer; font-family:var(--font-title); font-weight:bold; font-size:1.1rem; display:flex; align-items:center; justify-content:center;" title="Видалити рецепт">
                  ✕
                </button>
              ` : `
                <button data-action="open-recipe-modal-for-chip" style="background:#1a0f04; color:#f8f1e3; border:none; border-radius:4px; padding:0 16px; height:44px; cursor:pointer; font-family:var(--font-title); font-weight:bold; font-size:0.9rem;">
                  Вибрати
                </button>
              `}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  async _autoSaveChip() {
    if (!this.editingChip) return;
    const chip = this.chips.find(c => c.id === this.editingChip);
    if (!chip) return;

    const newName = this.$('#edit-chip-name')?.value.trim();
    const newColor = this.$('#edit-chip-color')?.value;

    if (newName && newName !== chip.name) {
      await MealPlanService.updateLabel(chip.id, { name: newName });
      chip.name = newName; // update local instantly
    }

    const meta = this.chipMeta[chip.id] || {};
    meta.color = newColor !== '#ffffff' ? newColor : '';

    this.chipMeta[chip.id] = meta;
    this._saveChipMeta();
  }

  async _handleAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    if (btn.tagName === 'BUTTON') e.preventDefault();

    const action = btn.dataset.action;

    if (action === 'edit-chip' || action === 'open-recipe-modal' || action === 'open-recipe-modal-for-chip') {
      this.popupPos = { x: e.clientX, y: e.clientY };
    }

    if (action === 'close-all-modals') {
      this.recipeModalOpen = false;
      this.editingChip = null;
      this._render();
      return;
    }

    if (action === 'refresh') {
      await this._loadData();
    } else if (action === 'toggle-view-chips') {
      this.viewModeChips = this.viewModeChips === 'image' ? 'text' : 'image';
      localStorage.setItem('eatpan_view_chips', this.viewModeChips);
      // DOM-only: toggle visibility of chip images in column 1 (no re-render!)
      const col1 = this.element.querySelectorAll('.mp-col')[0];
      if (col1) {
        col1.querySelectorAll('.chip img').forEach(img => {
          img.style.display = this.viewModeChips === 'text' ? 'none' : '';
        });
      }
      // Update button appearance
      btn.classList.toggle('active', this.viewModeChips === 'image');
      const icon1 = btn.querySelector('[data-lucide]');
      if (icon1) {
        icon1.setAttribute('data-lucide', this.viewModeChips === 'image' ? 'image' : 'image-off');
        if (window.lucide) lucide.createIcons({ root: btn });
      }
    } else if (action === 'toggle-view-schedule') {
      this.viewModeSchedule = this.viewModeSchedule === 'image' ? 'text' : 'image';
      localStorage.setItem('eatpan_view_schedule', this.viewModeSchedule);
      // DOM-only: toggle mode-text class on schedule items in column 2 (no re-render!)
      const col2 = this.element.querySelectorAll('.mp-col')[1];
      if (col2) {
        col2.querySelectorAll('.meal-item').forEach(item => {
          item.classList.toggle('mode-text', this.viewModeSchedule === 'text');
        });
      }
      // Update button appearance
      btn.classList.toggle('active', this.viewModeSchedule === 'image');
      const icon2 = btn.querySelector('[data-lucide]');
      if (icon2) {
        icon2.setAttribute('data-lucide', this.viewModeSchedule === 'image' ? 'image' : 'image-off');
        if (window.lucide) lucide.createIcons({ root: btn });
      }
    } else if (action === 'toggle-ing-checkbox') {
      const mealId = btn.dataset.mealId;
      const ing = btn.dataset.ing;

      if (!this.checkedIngs[mealId]) this.checkedIngs[mealId] = [];

      if (this.checkedIngs[mealId].includes(ing)) {
        this.checkedIngs[mealId] = this.checkedIngs[mealId].filter(i => i !== ing);
      } else {
        this.checkedIngs[mealId].push(ing);
      }

      this._saveCheckedIngs();
      // BUG-3 FIX: Targeted DOM update instead of full re-render
      const ingItem = btn.closest('.ing-item');
      if (ingItem) {
        const isChecked = this.checkedIngs[mealId].includes(ing);
        const inShopping = this.shoppingList.find(s => s.name === ing);
        // Update checkbox icon
        const iconEl = btn.querySelector('[data-lucide]');
        if (iconEl) {
          iconEl.setAttribute('data-lucide', isChecked ? 'check-square' : 'square');
          btn.style.color = isChecked ? '#166534' : 'rgba(0,0,0,0.3)';
          if (window.lucide) lucide.createIcons({ root: btn });
        }
        // Update text color
        ingItem.style.color = isChecked ? '#166534' : 'inherit';
        // Update arrow button visibility
        const arrowBtn = ingItem.querySelector('.ing-arrow-btn');
        if (arrowBtn) {
          if (isChecked) {
            arrowBtn.classList.add('hide-unless-hover');
          } else {
            arrowBtn.classList.remove('hide-unless-hover');
          }
          if (!inShopping) arrowBtn.style.opacity = isChecked ? '0' : '0.6';
        }
        // Update counter in parent chip
        const parentBlock = ingItem.closest('[style*="margin-bottom: 16px"]');
        if (parentBlock) {
          const counterEl = parentBlock.querySelector('.chip span[style*="font-size:1rem"]');
          if (counterEl) {
            const total = parentBlock.querySelectorAll('.ing-item').length;
            const checked = this.checkedIngs[mealId]?.length || 0;
            counterEl.textContent = `${checked}/${total}`;
          }
        }
      } else {
        this._render();
      }
    } else if (action === 'add-all-missing-to-shopping') {
      let added = 0;
      const promises = [];
      Object.values(this.schedule).forEach(day => {
        Object.values(day).forEach(meals => {
          meals.forEach(m => {
            const meta = this.chipMeta[m.notes];
            const inStock = meta ? meta.inStock : false;
            let ingredients = [];
            if (m.recipe_uuid && (this.recipes[m.recipe_uuid] || this.allRecipes.find(r => r.uuid === m.recipe_uuid))) {
              const rData = this.recipes[m.recipe_uuid] || this.allRecipes.find(r => r.uuid === m.recipe_uuid);
              if (rData.data && rData.data.ingredients) {
                ingredients = rData.data.ingredients.map(i => typeof i === 'string' ? i : (i.name || i.item));
              }
            }
            if (!inStock && ingredients.length > 0) {
              const checked = this.checkedIngs[m.id] || [];
              ingredients.forEach(ing => {
                if (ing && !checked.includes(ing) && !this.shoppingList.find(s => s.name === ing)) {
                  promises.push(ShoppingService.addItem(this.shoppingListObj.uuid, { name: ing, notes: m.recipe_title || 'Страва' }));
                  added++;
                }
              });
            }
          });
        });
      });
      if (added > 0) {
        btn.innerHTML = '<i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite;"></i> Додаємо...';
        const results = await Promise.all(promises);
        results.forEach(res => { if (res && res.uuid) this.shoppingList.push(res); });
        this._render();
      } else {
        alert("Всі відсутні інгредієнти вже у кошику або відмічені як наявні!");
      }
    } else if (action === 'toggle-expand-req') {
      const id = btn.dataset.id;
      this.expandedReqs[id] = !this.expandedReqs[id];
      this._render();
    } else if (action === 'add-to-shopping') {
      const ing = btn.dataset.ing;
      const meal = btn.dataset.meal || '';
      if (!this.shoppingList.find(s => s.name === ing)) {
        // BUG-5 FIX: Sync with API, not just localStorage
        if (this.shoppingListObj?.uuid) {
          const res = await ShoppingService.addItem(this.shoppingListObj.uuid, { name: ing, notes: meal });
          if (res && res.uuid) {
            this.shoppingList.push(res);
          } else {
            this.shoppingList.push({ name: ing, notes: meal });
          }
        } else {
          this.shoppingList.push({ name: ing, notes: meal });
        }
        // BUG-3 FIX: Update arrow icon to "already in cart" without full re-render
        const arrowIcon = btn.querySelector('[data-lucide]');
        if (arrowIcon) {
          arrowIcon.setAttribute('data-lucide', 'check-circle-2');
          arrowIcon.style.fill = 'rgba(22,163,74,0.1)';
          btn.style.color = '#16a34a';
          btn.style.opacity = '1';
          btn.title = 'Вже у кошику (додати ще)';
          if (window.lucide) lucide.createIcons({ root: btn });
        }
        // Add item to shopping list DOM
        const shoppingUl = this.element.querySelector('.mp-col:last-child .mp-col-body ul');
        if (shoppingUl) {
          const li = document.createElement('li');
          li.className = 'shopping-row';
          li.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background: white; padding: 10px 14px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05);';
          li.innerHTML = `<div style="display:flex; flex-direction:column; gap:2px;"><span style="font-size: 1rem; font-family: var(--font-body); font-weight: 500;">${ing}</span>${meal ? `<span style="font-size:0.75rem; opacity:0.6; font-family:var(--font-title);">(для ${meal})</span>` : ''}</div>`;
          shoppingUl.appendChild(li);
          // Remove "empty" placeholder if present
          const emptyMsg = this.element.querySelector('.mp-col:last-child .mp-col-body > div[style*="opacity:0.5"]');
          if (emptyMsg) emptyMsg.remove();
        } else {
          this._render();
        }
      }
    } else if (action === 'toggle-add-chip') {
      this.showAddChip = this.showAddChip === btn.dataset.target ? null : btn.dataset.target;
      this.selectedIcon = 'utensils';
      this.isIconDropdownOpen = false;
      this._render();
    } else if (action === 'toggle-icon-dropdown') {
      this.isIconDropdownOpen = !this.isIconDropdownOpen;
      this._render();
    } else if (action === 'select-icon') {
      this.selectedIcon = btn.dataset.icon;
      this.isIconDropdownOpen = false;
      this._render();
    } else if (action === 'create-shopping-list') {
      if (this.shoppingList.length === 0) {
        alert("Спочатку додайте інгредієнти до списку покупок.");
        return;
      }
      try {
        const dateStr = new Date().toLocaleDateString('uk-UA');
        const listName = `План від ${dateStr}`;
        const newList = await ShoppingService.createList({ name: listName });
        
        if (newList && newList.uuid) {
          const promises = this.shoppingList.map(item => 
            ShoppingService.addItem(newList.uuid, { 
              name: item.name, 
              quantity: 1, 
              notes: item.notes 
            })
          );
          await Promise.all(promises);
          alert(`Список "${listName}" успішно створено та збережено в секторі "Списки покупок"!`);
        }
      } catch (err) {
        console.error('Помилка створення списку покупок', err);
        alert('Не вдалося зберегти список покупок. Спробуйте пізніше.');
      }
    } else if (action === 'clear-shopping') {
      if (confirm('Ви впевнені, що хочете очистити поточний список?')) {
        this.shoppingList = [];
        this._render();
      }
    } else if (action === 'save-chip') {
      const nameInp = this.$('#new-chip-name');
      const name = nameInp?.value.trim();
      if (name) {
        try {
          const res = await MealPlanService.createLabel({ name, color: '#dddddd' });
          if (res && res.uuid) {
            this.chipMeta[res.uuid] = { icon: this.selectedIcon || 'utensils', inStock: btn.dataset.stock === 'true' };
            this._saveChipMeta();
            // Optimistic: add chip locally instead of full reload
            this.chips.push({ id: res.uuid, name, color: '#dddddd' });
          }
          this.showAddChip = null;
          this._render();
        } catch (err) { console.error('Error saving chip', err); }
      }
    } else if (action === 'delete-schedule') {
      // BUG-4 FIX: Action name was 'delete-entry' but template uses 'delete-schedule'
      if (confirm('Ви впевнені, що хочете видалити цю страву з розкладу?')) {
        const entryId = btn.dataset.id;
        // Optimistic: remove from local schedule
        for (const date in this.schedule) {
          for (const type in this.schedule[date]) {
            this.schedule[date][type] = this.schedule[date][type].filter(m => m.id !== entryId);
          }
        }
        this._render();
        // Persist in background
        MealPlanService.delete(entryId).catch(err => console.warn('Delete error', err));
      }
    } else if (action === 'remove-shopping') {
      this.shoppingList.splice(parseInt(btn.dataset.idx), 1);
      this._saveShoppingList();
      this._render();
    } else if (action === 'open-recipe-modal') {
      this.activeEntryForRecipe = btn.dataset.id;
      this.recipeModalOpen = true;
      this.editingChip = null;
      this._render();
    } else if (action === 'open-recipe-modal-for-chip') {
      this.activeEntryForRecipe = this.editingChip;
      this.recipeModalOpen = true;
      this.editingChip = null;
      this._render();
    } else if (action === 'bind-recipe') {
      const id = this.activeEntryForRecipe;
      const rId = btn.dataset.recipeUuid;
      const rTitle = btn.dataset.recipeTitle;

      if (id && rId) {
        if (this.chips.find(c => c.id === id)) {
          // Binding to a chip (Auto-save)
          const meta = this.chipMeta[id] || {};
          meta.recipe_uuid = rId;
          meta.recipe_title = rTitle;
          this.chipMeta[id] = meta;
          this._saveChipMeta();

          this.editingChip = id; // Reopen chip modal
          this.recipeModalOpen = false;
          this._render();
        } else {
          // Binding to a schedule entry — optimistic update
          // Update local schedule data immediately
          for (const date in this.schedule) {
            for (const type in this.schedule[date]) {
              const entry = this.schedule[date][type].find(m => m.id === id);
              if (entry) {
                entry.recipe_uuid = rId;
                entry.recipe_title = rTitle;
              }
            }
          }
          this.recipeModalOpen = false;
          this._render();
          // Persist in background
          MealPlanService.bindRecipe(id, rId).catch(e => console.warn('Bind error', e));
          MealPlanService.update(id, { recipe_title: rTitle }).catch(e => console.warn('Update error', e));
        }
      }
    } else if (action === 'unbind-chip-recipe') {
      const id = this.editingChip;
      if (id) {
        const meta = this.chipMeta[id] || {};
        meta.recipe_uuid = null;
        meta.recipe_title = null;
        this.chipMeta[id] = meta;
        this._saveChipMeta();
        this._render();
      }
    } else if (action === 'unbind-recipe') {
      const id = this.activeEntryForRecipe;
      if (id) {
        if (this.chips.find(c => c.id === id)) {
          this.recipeModalOpen = false;
          this.editingChip = id;
          this._render();
        } else {
          // Optimistic update for schedule entries
          for (const date in this.schedule) {
            for (const type in this.schedule[date]) {
              const entry = this.schedule[date][type].find(m => m.id === id);
              if (entry) {
                entry.recipe_uuid = null;
                entry.recipe_title = null;
              }
            }
          }
          this.recipeModalOpen = false;
          this._render();
          MealPlanService.update(id, { recipe_uuid: null, recipe_title: null }).catch(e => console.warn('Unbind error', e));
        }
      }
    } else if (action === 'edit-chip') {
      this.editingChip = btn.dataset.id;
      this.editChipIconOpen = false;
      this.recipeModalOpen = false;
      this._render();
    } else if (action === 'toggle-edit-icon-dropdown') {
      this.editChipIconOpen = !this.editChipIconOpen;
      this._render();
    } else if (action === 'select-edit-icon') {
      if (this.editingChip) {
        const meta = this.chipMeta[this.editingChip] || {};
        meta.icon = btn.dataset.icon;
        this.chipMeta[this.editingChip] = meta;
        this._saveChipMeta();
      }
      this.editChipIconOpen = false;
      this._render();
    } else if (action === 'set-chip-color') {
      const colorInp = this.$('#edit-chip-color');
      if (colorInp) {
        colorInp.value = btn.dataset.color;
        this._autoSaveChip();
      }
    } else if (action === 'delete-chip') {
      if (confirm('Видалити страву з бази?')) {
        await MealPlanService.deleteLabel(this.editingChip);
        delete this.chipMeta[this.editingChip];
        this._saveChipMeta();
        this.editingChip = null;
        await this._loadData();
      }
    }
  }

  // --- Drag and Drop ---
  _handleDragStart(e) {
    const el = e.target.closest('[draggable="true"]');
    if (!el) return;

    const type = el.dataset.dragType;
    if (type === 'chip') {
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'chip',
        id: el.dataset.id,
        name: el.dataset.name
      }));
    } else if (type === 'ingredient') {
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'ingredient',
        name: el.dataset.name,
        meal: el.dataset.meal || ''
      }));
    } else if (type === 'schedule-item') {
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'schedule-item',
        id: el.dataset.id
      }));
    }
    e.dataTransfer.effectAllowed = 'copyMove';
  }

  _handleDragOver(e) {
    const dropzone = e.target.closest('.dropzone');
    if (!dropzone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dropzone.classList.add('drag-over');
  }

  _handleDragLeave(e) {
    const dropzone = e.target.closest('.dropzone');
    if (dropzone) dropzone.classList.remove('drag-over');
  }

  async _handleDrop(e) {
    const dropzone = e.target.closest('.dropzone');
    if (!dropzone) return;
    e.preventDefault();
    dropzone.classList.remove('drag-over');

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      const targetType = dropzone.dataset.dropType;

      if (data.type === 'chip') {
        if (targetType === 'chip-in' || targetType === 'chip-out') {
          const inStock = targetType === 'chip-in';
          if (this.chipMeta[data.id]) {
            this.chipMeta[data.id].inStock = inStock;
            this._saveChipMeta();
            this._render();
          }
        } else if (targetType === 'schedule') {
          const date = dropzone.dataset.date;
          const mealType = dropzone.dataset.type;

          const chipMeta = this.chipMeta[data.id] || {};

          await MealPlanService.create({
            date: date,
            meal_type: mealType,
            portions: 2,
            notes: data.id,
            recipe_title: chipMeta.recipe_title || data.name,
            recipe_uuid: chipMeta.recipe_uuid || null
          });
          await this._loadData();
        }
      } else if (data.type === 'schedule-item') {
        if (targetType === 'schedule') {
          const newDate = dropzone.dataset.date;
          const newMealType = dropzone.dataset.type;

          // BUG-1 FIX: Optimistic local update instead of full reload
          // 1. Find and remove entry from old slot
          let movedEntry = null;
          for (const date in this.schedule) {
            for (const type in this.schedule[date]) {
              const idx = this.schedule[date][type].findIndex(m => m.id === data.id);
              if (idx !== -1) {
                movedEntry = this.schedule[date][type].splice(idx, 1)[0];
                break;
              }
            }
            if (movedEntry) break;
          }
          // 2. Update entry fields and add to new slot
          if (movedEntry) {
            movedEntry.date = newDate;
            movedEntry.meal_type = newMealType;
            if (!this.schedule[newDate]) this.schedule[newDate] = {};
            if (!this.schedule[newDate][newMealType]) this.schedule[newDate][newMealType] = [];
            this.schedule[newDate][newMealType].push(movedEntry);
          }
          // 3. DOM move: just move the existing element to the new dropzone
          //    This avoids innerHTML rebuild which would destroy <img> and re-fetch all images
          const draggedEl = this.element.querySelector(`.meal-item[data-id="${data.id}"]`);
          if (draggedEl) {
            dropzone.appendChild(draggedEl);
          } else {
            // Fallback: full re-render if DOM element not found
            this._render();
          }
          // 4. Persist in background — no await, no _loadData
          MealPlanService.update(data.id, { date: newDate, meal_type: newMealType })
            .catch(err => console.warn('Schedule move API error', err));
        }
      } else if (data.type === 'ingredient') {
        if (targetType === 'shopping') {
          if (!this.shoppingList.find(s => s.name === data.name)) {
            dropzone.style.opacity = '0.5';
            const res = await ShoppingService.addItem(this.shoppingListObj.uuid, { name: data.name, notes: data.meal || '' });
            dropzone.style.opacity = '1';
            if (res && res.uuid) {
              this.shoppingList.push(res);
              this._render();
            }
          }
        }
      }
    } catch (err) {
      console.warn('Drop error', err);
    }
  }
}
