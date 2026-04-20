/**
 * PantryStub — болванка для сектора "Storage"
 * Показує Готові страви (з Планувальника) та Інгредієнти (з Кладової)
 * Дозволяє фільтрувати за локаціями.
 */
import Component from '../../core/Component.js';
import { PantryService, MealPlanService, RecipeService } from '../../core/ApiClient.js';

export default class PantryStub extends Component {
  constructor(props = {}) {
    super(props);
    this.pantryData = null;
    this.mealLabels = {};
    this.mealLocations = {};
    this.allIngredients = [];
    this.allRecipes = [];
    this.report = null;
    this._error = null;
    this.activeMealLocation = 'all';
    this.activePantryLocation = 'all';
  }

  async template() {
    return `
      <div class="stub-sector-root" style="padding:16px; height:100%; overflow-y:auto; font-family:var(--font-body, sans-serif); background: radial-gradient(circle at center, var(--parchment-light, #f8f1e3) 0%, var(--parchment-dark, #e6d3b3) 120%); color: var(--c-ink-primary, #2c1b18); box-sizing: border-box; display: flex; flex-direction: column;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px; border-bottom: 2px solid rgba(26,15,4,0.2); padding-bottom: 12px;">
          <h2 style="font-family:var(--font-title);color:var(--text-accent);font-size:1.5rem;margin:0;">
            <i data-lucide="package-open" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;"></i>
            Місця зберігання
          </h2>
          <button class="stub-btn stub-btn--primary" data-action="refresh" style="background:var(--c-ink-primary); color:var(--bg-parchment); border:1px solid var(--c-accent-gold); padding:8px 16px; font-family:var(--font-title); border-radius:6px; cursor:pointer;">
            <i data-lucide="refresh-cw" style="width:14px;height:14px; margin-right:4px;"></i> Оновити
          </button>
        </div>

        <div id="pantry-content" style="flex:1; display:flex; flex-direction:column;">
          <div style="text-align:center; font-style:italic; padding: 40px; color: var(--c-ink-light);">Завантаження...</div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    this.element.addEventListener('change', (e) => this._handleChange(e));
    
    // Listen for global mealplan updates (e.g. from RecipeBook ribbons)
    this._onMealPlanUpdated = () => {
      this._loadData();
    };
    window.addEventListener('mealplan-updated', this._onMealPlanUpdated);

    await this._loadData();
  }

  onDestroy() {
    if (this._onMealPlanUpdated) {
      window.removeEventListener('mealplan-updated', this._onMealPlanUpdated);
    }
    super.onDestroy();
  }

  async _loadData() {
    const contentEl = this.element.querySelector('#pantry-content');
    if (!contentEl) return;

    try {
      this.pantryData = await PantryService.fetchAll();
      this.report = await PantryService.expirationReport();
      const labelsRes = await MealPlanService.fetchLabels();
      this.mealLabels = labelsRes?.labels || {};
      
      const mealLocRes = await MealPlanService.locations.fetchAll();
      this.mealLocations = mealLocRes?.locations || {};
      
      const ings = await RecipeService.fetchIngredients();
      this.allIngredients = Array.isArray(ings) ? ings : (ings?.ingredients || []);
      
      const recRes = await RecipeService.fetchAll({ limit: 500 });
      this.allRecipes = Array.isArray(recRes) ? recRes : [];

      this._error = null;
    } catch (err) {
      this._error = err.message || 'Помилка API';
      console.warn('[PantryStub]', err);
    }

    contentEl.innerHTML = this._renderContent();
    if (window.lucide) lucide.createIcons({ root: contentEl });
  }

  _renderContent() {
    if (this._error) {
      return `<div class="stub-section"><div class="stub-json" style="color:red;">${this._error}</div></div>`;
    }

    const items = this.pantryData?.items || {};
    const locations = this.pantryData?.locations || {};
    const locEntries = Object.entries(locations);

    const mealLocations = this.mealLocations || {};
    const mealLocEntries = Object.entries(mealLocations);

    // Filter Ready Meals (inStock = true)
    const readyMeals = Object.entries(this.mealLabels)
      .filter(([id, label]) => label.inStock === true)
      .map(([id, label]) => ({ id, ...label }));

    // Filter Ingredients
    const ingredientItems = Object.entries(items).map(([id, item]) => ({ id, ...item }));

    // Apply Location Filter
    const filteredMeals = this.activeMealLocation === 'all' 
      ? readyMeals 
      : readyMeals.filter(m => m.location_uuid === this.activeMealLocation);
      
    const filteredIngredients = this.activePantryLocation === 'all'
      ? ingredientItems
      : ingredientItems.filter(i => i.location === this.activePantryLocation);

    const expired = this.report?.expired || [];
    const expiringSoon = this.report?.expiring_soon || [];

    const createLocTabsHTML = (activeLoc, entries, prefix) => `
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        <button class="stub-btn ${activeLoc === 'all' ? 'active' : ''}" data-action="set-${prefix}-location" data-id="all" style="font-weight:bold; font-size:0.8rem; padding:4px 8px; ${activeLoc === 'all' ? 'background:rgba(0,0,0,0.1);' : ''}">
          Усі
        </button>
        ${entries.map(([id, loc]) => `
          <div style="display:flex; align-items:center;">
            <button class="stub-btn ${activeLoc === id ? 'active' : ''}" data-action="set-${prefix}-location" data-id="${id}" style="font-size:0.8rem; padding:4px 8px; ${activeLoc === id ? 'background:rgba(0,0,0,0.1); border-top-right-radius:0; border-bottom-right-radius:0;' : ''}">
              ${loc.name}
            </button>
            ${activeLoc === id ? `
              <div style="display:flex; background:rgba(0,0,0,0.1); border-left:1px solid rgba(0,0,0,0.1); border-top-right-radius:6px; border-bottom-right-radius:6px; padding:2px;">
                <button class="stub-btn" data-action="edit-${prefix}-location" data-id="${id}" data-name="${loc.name}" style="padding:2px 4px; font-size:0.8rem; border:none; background:none;" title="Редагувати">✎</button>
                <button class="stub-btn" data-action="delete-${prefix}-location" data-id="${id}" style="padding:2px 4px; font-size:0.8rem; color:#c44; border:none; background:none;" title="Видалити">🗑️</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
        <button class="stub-btn" data-action="manage-${prefix}-locations" style="opacity:0.7; font-size:0.8rem; padding:4px 8px;" title="Додати локацію">
          <i data-lucide="plus" style="width:12px;height:12px;"></i> Локація
        </button>
      </div>
    `;

    return `
      ${(expired.length + expiringSoon.length) > 0 ? `
      <div class="stub-section" style="border-left:3px solid #c44; background: rgba(204,68,68,0.05); padding:8px; margin-bottom:12px; border-radius:4px;">
        <div style="font-weight:bold; color:#c44; margin-bottom:4px;"><i data-lucide="alert-triangle" style="width:16px;"></i> Терміни придатності</div>
        ${expired.map(i => `<div class="stub-row" style="font-size:0.9rem;"><span>${i.name}</span><span class="stub-badge stub-badge--error">Прострочено</span></div>`).join('')}
        ${expiringSoon.map(i => `<div class="stub-row" style="font-size:0.9rem;"><span>${i.name}</span><span class="stub-badge stub-badge--warn">${i.days_left || 0} дн.</span></div>`).join('')}
      </div>` : ''}

      <div style="display:flex; gap:16px; flex:1; align-items:flex-start; min-height:0;">
        
        <!-- READY MEALS COLUMN -->
        <div style="flex:1; background:rgba(255,255,255,0.4); border-radius:8px; border:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column; overflow:hidden;">
          <div style="background:rgba(22, 101, 52, 0.1); padding:10px 12px; font-weight:bold; color:#166534; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="display:flex; align-items:center; gap:6px;"><i data-lucide="soup" style="width:18px;height:18px;"></i> Готові страви (${filteredMeals.length})</span>
              <button class="stub-btn" data-action="toggle-add-meal" style="padding:2px 6px;"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
            </div>
            ${createLocTabsHTML(this.activeMealLocation, mealLocEntries, 'meal')}
          </div>
          
          <div id="add-meal-form" style="display:none; padding:12px; background:rgba(0,0,0,0.02); border-bottom:1px solid rgba(0,0,0,0.05);">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <input class="stub-input" id="pm-name" list="ready-meals-list" placeholder="Шукати страву..." style="flex:1; min-width:160px;" />
              <datalist id="ready-meals-list">
                ${Object.entries(this.mealLabels).filter(([id, l]) => !l.inStock).map(([id, l]) => `<option value="[План] ${l.name}" data-type="chip" data-id="${id}"></option>`).join('')}
                ${this.allRecipes.map(r => `<option value="[Рецепт] ${r.name || r.data?.title || 'Без назви'}" data-type="recipe" data-id="${r.uuid}"></option>`).join('')}
              </datalist>
              <select class="stub-input" id="pm-loc" style="width:120px;">
                <option value="">Без локації</option>
                ${mealLocEntries.map(([locId, loc]) => `<option value="${locId}" ${this.activeMealLocation === locId ? 'selected' : ''}>${loc.name}</option>`).join('')}
              </select>
              <button class="stub-btn stub-btn--primary" data-action="add-meal">Додати</button>
            </div>
          </div>

          <div style="padding:12px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px;">
            ${filteredMeals.length === 0 ? '<div style="opacity:0.5; text-align:center; padding:20px; font-style:italic;">Немає готових страв у цій локації. Додайте їх у рецептах!</div>' : ''}
            ${filteredMeals.map(m => `
              <div class="stub-row" style="background:white; border-radius:6px; padding:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; gap:8px; flex:1;">
                  <i data-lucide="${m.icon || 'utensils'}" style="width:16px;height:16px;color:${m.color || '#888'};"></i>
                  <span style="font-weight:500;">${m.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <select class="stub-input loc-select" data-type="meal" data-id="${m.id}" style="padding:2px 4px; font-size:0.8rem; height:auto; width:120px;">
                    <option value="">Без локації</option>
                    ${mealLocEntries.map(([locId, loc]) => `<option value="${locId}" ${m.location_uuid === locId ? 'selected' : ''}>${loc.name}</option>`).join('')}
                  </select>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- INGREDIENTS COLUMN -->
        <div style="flex:1; background:rgba(255,255,255,0.4); border-radius:8px; border:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column; overflow:hidden;">
          <div style="background:rgba(0,0,0,0.05); padding:10px 12px; font-weight:bold; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="display:flex; align-items:center; gap:6px;"><i data-lucide="carrot" style="width:18px;height:18px;"></i> Інгредієнти (${filteredIngredients.length})</span>
              <button class="stub-btn" data-action="toggle-add-item" style="padding:2px 6px;"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
            </div>
            ${createLocTabsHTML(this.activePantryLocation, locEntries, 'pantry')}
          </div>
          
          <div id="add-item-form" style="display:none; padding:12px; background:rgba(0,0,0,0.02); border-bottom:1px solid rgba(0,0,0,0.05);">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <input class="stub-input" id="pi-name" list="ingredients-list" placeholder="Назва..." style="flex:1; min-width:120px;" autocomplete="off" />
              <datalist id="ingredients-list">
                ${this.allIngredients.map(ing => `<option value="${ing}"></option>`).join('')}
              </datalist>
              <input class="stub-input" id="pi-qty" placeholder="К-ть" type="number" value="1" style="width:60px;" />
              <input class="stub-input" id="pi-unit" placeholder="Од." value="шт" style="width:50px;" />
              <select class="stub-input" id="pi-loc" style="width:100px;">
                <option value="">Без локації</option>
                ${locEntries.map(([locId, loc]) => `<option value="${locId}">${loc.name}</option>`).join('')}
              </select>
              <button class="stub-btn stub-btn--primary" data-action="add-item">Додати</button>
            </div>
          </div>

          <div style="padding:12px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px;">
            ${filteredIngredients.length === 0 ? '<div style="opacity:0.5; text-align:center; padding:20px; font-style:italic;">Порожньо</div>' : ''}
            ${filteredIngredients.map(i => `
              <div class="stub-row" style="background:white; border-radius:6px; padding:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex:1;">
                  <div>
                    <span style="font-weight:500;">${i.name}</span>
                    <span style="opacity:0.6; font-size:0.85rem; margin-left:6px;">${i.quantity} ${i.unit}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <select class="stub-input loc-select" data-type="ingredient" data-id="${i.id}" style="padding:2px 4px; font-size:0.8rem; height:auto; width:100px;">
                      <option value="">Без локації</option>
                      ${locEntries.map(([locId, loc]) => `<option value="${locId}" ${i.location === locId ? 'selected' : ''}>${loc.name}</option>`).join('')}
                    </select>
                    <button class="stub-btn stub-btn--danger" data-action="delete-item" data-id="${i.id}" style="padding:2px 4px;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
      </div>
    `;
  }

  async _handleAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    try {
      if (action === 'refresh') {
        await this._loadData();
      } else if (action === 'set-meal-location') {
        this.activeMealLocation = btn.dataset.id;
        this.element.querySelector('#pantry-content').innerHTML = this._renderContent();
        if (window.lucide) lucide.createIcons({ root: this.element.querySelector('#pantry-content') });
      } else if (action === 'set-pantry-location') {
        this.activePantryLocation = btn.dataset.id;
        this.element.querySelector('#pantry-content').innerHTML = this._renderContent();
        if (window.lucide) lucide.createIcons({ root: this.element.querySelector('#pantry-content') });
      } else if (action === 'toggle-add-item') {
        const form = this.$('#add-item-form');
        if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      } else if (action === 'toggle-add-meal') {
        const form = this.$('#add-meal-form');
        if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      } else if (action === 'add-meal') {
        const val = this.$('#pm-name')?.value;
        const option = Array.from(this.element.querySelectorAll('#ready-meals-list option')).find(opt => opt.value === val);
        if (option) {
          const type = option.dataset.type;
          const id = option.dataset.id;
          const location_uuid = this.$('#pm-loc')?.value || '';
          
          if (type === 'chip') {
            await MealPlanService.updateLabel(id, { inStock: true, location_uuid });
          } else if (type === 'recipe') {
            const recipeTitle = val.replace('[Рецепт] ', '');
            await MealPlanService.createLabel({ 
              name: recipeTitle, 
              inStock: true, 
              recipe_uuid: id, 
              location_uuid, 
              icon: 'soup', 
              color: '#166534' 
            });
          }
          await this._loadData();
        }
      } else if (action === 'add-item') {
        const name = this.$('#pi-name')?.value;
        const quantity = parseInt(this.$('#pi-qty')?.value || '1');
        const unit = this.$('#pi-unit')?.value || 'шт';
        const location = this.$('#pi-loc')?.value || '';
        if (name) {
          await PantryService.addItem({ name, quantity, unit, location });
          await this._loadData();
        }
      } else if (action === 'delete-item') {
        if(confirm('Видалити інгредієнт?')) {
          await PantryService.deleteItem(btn.dataset.id);
          await this._loadData();
        }
      } else if (action === 'manage-meal-locations') {
        const locName = prompt('Додати нову локацію для страв (введіть назву):');
        if (locName) {
          await MealPlanService.locations.create({ name: locName });
          await this._loadData();
        }
      } else if (action === 'manage-pantry-locations') {
        const locName = prompt('Додати нову локацію для інгредієнтів (введіть назву):');
        if (locName) {
          await PantryService.addLocation({ name: locName });
          await this._loadData();
        }
      } else if (action === 'edit-meal-location') {
        const id = btn.dataset.id;
        const newName = prompt('Нова назва локації:', btn.dataset.name);
        if (newName && newName !== btn.dataset.name) {
          await MealPlanService.locations.update(id, { name: newName });
          await this._loadData();
        }
      } else if (action === 'delete-meal-location') {
        if (confirm('Ви впевнені, що хочете видалити цю локацію? Усі страви в ній залишаться, але будуть "Без локації".')) {
          await MealPlanService.locations.delete(btn.dataset.id);
          this.activeMealLocation = 'all';
          await this._loadData();
        }
      } else if (action === 'edit-pantry-location') {
        const id = btn.dataset.id;
        const newName = prompt('Нова назва локації:', btn.dataset.name);
        if (newName && newName !== btn.dataset.name) {
          await PantryService.updateLocation(id, { name: newName });
          await this._loadData();
        }
      } else if (action === 'delete-pantry-location') {
        if (confirm('Ви впевнені, що хочете видалити цю локацію? Усі інгредієнти в ній залишаться, але будуть "Без локації".')) {
          await PantryService.deleteLocation(btn.dataset.id);
          this.activePantryLocation = 'all';
          await this._loadData();
        }
      }
    } catch (err) {
      console.warn('[PantryStub] Action error:', err);
    }
  }

  async _handleChange(e) {
    if (e.target.classList.contains('loc-select')) {
      const type = e.target.dataset.type;
      const id = e.target.dataset.id;
      const newLoc = e.target.value;

      try {
        if (type === 'meal') {
          await MealPlanService.updateLabel(id, { location_uuid: newLoc });
        } else if (type === 'ingredient') {
          await PantryService.updateItem(id, { location: newLoc });
        }
        // Update local state optimistic
        if (type === 'meal' && this.mealLabels[id]) {
            this.mealLabels[id].location_uuid = newLoc;
        } else if (type === 'ingredient' && this.pantryData.items[id]) {
            this.pantryData.items[id].location = newLoc;
        }
        // If we are filtering by location and we moved it out, we might want to re-render
        if ((type === 'meal' && this.activeMealLocation !== 'all') || 
            (type === 'ingredient' && this.activePantryLocation !== 'all')) {
          this.element.querySelector('#pantry-content').innerHTML = this._renderContent();
          if (window.lucide) lucide.createIcons({ root: this.element.querySelector('#pantry-content') });
        }
      } catch (err) {
        console.warn('Update location failed', err);
        // Revert on error
        await this._loadData();
      }
    }
  }
}
