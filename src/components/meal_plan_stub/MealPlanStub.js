/**
 * MealPlanStub — болванка для сектора "Kitchen"
 * Показывает записи плана, метки, привязку рецептов.
 * CRUD через MealPlanService.
 */
import Component from '../../core/Component.js';
import { MealPlanService } from '../../core/ApiClient.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default class MealPlanStub extends Component {
  constructor(props = {}) {
    super(props);
    this.data = null;
    this.labels = null;
    this._error = null;
  }

  async template() {
    return `
      <div class="stub-sector-root" style="padding:16px; height:100%; overflow-y:auto; font-family:var(--font-body, sans-serif);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-family:var(--font-title);color:var(--text-accent);font-size:1.2rem;margin:0;">
            <i data-lucide="cooking-pot" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
            План харчування
          </h2>
          <button class="stub-btn stub-btn--primary" data-action="refresh">
            <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Оновити
          </button>
        </div>
        <div id="mealplan-content"><div class="stub-loading">Завантаження...</div></div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    await this._loadData();
  }

  async _loadData() {
    const el = this.$('#mealplan-content');
    if (!el) return;
    try {
      this.data = await MealPlanService.fetchAll();
      this.labels = await MealPlanService.fetchLabels();
      this._error = null;
    } catch (err) {
      this._error = err.message || 'Помилка API';
    }
    el.innerHTML = this._renderContent();
    if (window.lucide) lucide.createIcons({ root: el });
  }

  _renderContent() {
    if (this._error) return `<div class="stub-section"><div class="stub-json">${this._error}</div></div>`;

    const entries = Object.entries(this.data?.entries || {});
    const labelEntries = Object.entries(this.labels?.labels || {});
    const today = new Date().toISOString().split('T')[0];

    // Group by date
    const byDate = {};
    entries.forEach(([id, e]) => {
      const d = e.date || 'no-date';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({ id, ...e });
    });

    const sortedDates = Object.keys(byDate).sort().reverse();

    return `
      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="calendar-days"></i> Записи (${entries.length})</div>
        ${sortedDates.length === 0
          ? '<div class="stub-loading">Створіть перший запис</div>'
          : sortedDates.map(date => `
            <div style="margin-bottom:8px;">
              <div style="font-weight:700;font-size:0.8rem;opacity:0.6;margin-bottom:4px;">${date} ${date === today ? '(сьогодні)' : ''}</div>
              ${byDate[date].map(e => `
                <div class="stub-row">
                  <span>
                    <span class="stub-badge stub-badge--info">${e.meal_type}</span>
                    ${e.recipe_title || 'без рецепта'}
                    <span style="opacity:0.4;font-size:0.75rem;margin-left:4px;">${e.portions} порц.</span>
                  </span>
                  <div style="display:flex;gap:4px;">
                    <button class="stub-btn" data-action="edit-entry" data-id="${e.id}" style="font-size:0.65rem;">Ред.</button>
                    <button class="stub-btn stub-btn--danger" data-action="delete-entry" data-id="${e.id}" style="font-size:0.65rem;">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="plus-circle"></i> Новий запис</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <input class="stub-input" id="mp-date" type="date" value="${today}" style="max-width:140px;" />
          <select class="stub-input" id="mp-type" style="max-width:120px;">
            ${MEAL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <input class="stub-input" id="mp-portions" type="number" value="2" style="max-width:50px;" />
          <input class="stub-input" id="mp-notes" placeholder="Нотатки..." style="max-width:140px;" />
          <button class="stub-btn stub-btn--primary" data-action="create-entry">Створити</button>
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="tag"></i> Мітки (${labelEntries.length})</div>
        ${labelEntries.map(([id, l]) => `
          <div class="stub-row">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="width:12px;height:12px;border-radius:50%;background:${l.color};display:inline-block;"></span>
              ${l.name}
            </span>
            <div style="display:flex;gap:4px;">
              <button class="stub-btn" data-action="edit-label" data-id="${id}" style="font-size:0.65rem;">Ред.</button>
              <button class="stub-btn stub-btn--danger" data-action="delete-label" data-id="${id}" style="font-size:0.65rem;">✕</button>
            </div>
          </div>
        `).join('')}
        <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
          <input class="stub-input" id="mp-label-name" placeholder="Нова мітка..." style="max-width:140px;" />
          <input class="stub-input" id="mp-label-color" type="color" value="#3388ff" style="max-width:40px;padding:2px;" />
          <button class="stub-btn" data-action="create-label">Додати</button>
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
      } else if (action === 'create-entry') {
        const date = this.$('#mp-date')?.value;
        const meal_type = this.$('#mp-type')?.value;
        const portions = parseInt(this.$('#mp-portions')?.value || '2');
        const notes = this.$('#mp-notes')?.value || '';
        await MealPlanService.create({ date, meal_type, portions, notes });
        await this._loadData();
      } else if (action === 'delete-entry') {
        await MealPlanService.delete(btn.dataset.id);
        await this._loadData();
      } else if (action === 'create-label') {
        const name = this.$('#mp-label-name')?.value;
        const color = this.$('#mp-label-color')?.value;
        if (name) {
          await MealPlanService.createLabel({ name, color });
          await this._loadData();
        }
      } else if (action === 'delete-label') {
        await MealPlanService.deleteLabel(btn.dataset.id);
        await this._loadData();
      } else if (action === 'edit-entry') {
        const newPortions = prompt("Нова кількість порцій:");
        if (newPortions && !isNaN(newPortions)) {
          await MealPlanService.update(btn.dataset.id, { portions: parseInt(newPortions) });
          await this._loadData();
        }
      } else if (action === 'edit-label') {
        const newName = prompt("Нова назва мітки:");
        if (newName) {
          await MealPlanService.updateLabel(btn.dataset.id, { name: newName });
          await this._loadData();
        }
      }
    } catch (err) {
      console.warn('[MealPlanStub]', err);
    }
  }
}
