/**
 * PantryStub — болванка для сектора "Storage"
 * Показывает продукты, локации и отчёт по свежести.
 * Делает реальные API-вызовы через PantryService.
 */
import Component from '../../core/Component.js';
import { PantryService } from '../../core/ApiClient.js';

export default class PantryStub extends Component {
  constructor(props = {}) {
    super(props);
    this.data = null;
    this.report = null;
    this._error = null;
  }

  async template() {
    return `
      <div class="stub-sector-root" style="padding:16px; height:100%; overflow-y:auto; font-family:var(--font-body, sans-serif);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-family:var(--font-title);color:var(--text-accent);font-size:1.2rem;margin:0;">
            <i data-lucide="package-open" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
            Кладова
          </h2>
          <button class="stub-btn stub-btn--primary" data-action="refresh">
            <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Оновити
          </button>
        </div>

        <div id="pantry-content">
          <div class="stub-loading">Завантаження...</div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    await this._loadData();
  }

  async _loadData() {
    const contentEl = this.element.querySelector('#pantry-content');
    if (!contentEl) return;

    try {
      this.data = await PantryService.fetchAll();
      this.report = await PantryService.expirationReport();
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
      return `<div class="stub-section"><div class="stub-json">${this._error}</div></div>`;
    }

    const items = this.data?.items || {};
    const locations = this.data?.locations || {};
    const itemEntries = Object.entries(items);
    const locEntries = Object.entries(locations);

    const expired = this.report?.expired || [];
    const expiringSoon = this.report?.expiring_soon || [];

    return `
      ${(expired.length + expiringSoon.length) > 0 ? `
      <div class="stub-section" style="border-left:3px solid #c44;">
        <div class="stub-section__title"><i data-lucide="alert-triangle"></i> Терміни придатності</div>
        ${expired.map(i => `<div class="stub-row"><span>${i.name}</span><span class="stub-badge stub-badge--error">Прострочено</span></div>`).join('')}
        ${expiringSoon.map(i => `<div class="stub-row"><span>${i.name}</span><span class="stub-badge stub-badge--warn">${i.days_left || 0} дн.</span></div>`).join('')}
      </div>` : ''}

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="box"></i> Продукти (${itemEntries.length})</div>
        ${itemEntries.length === 0
          ? '<div class="stub-loading">Порожньо</div>'
          : itemEntries.map(([id, item]) => `
            <div class="stub-row">
              <span>${item.name} — ${item.quantity} ${item.unit}</span>
              <div style="display:flex;gap:4px;">
                <button class="stub-btn" data-action="edit-item" data-id="${id}" style="font-size:0.65rem;">Ред.</button>
                <button class="stub-btn stub-btn--danger" data-action="delete-item" data-id="${id}" style="font-size:0.65rem;">✕</button>
              </div>
            </div>
          `).join('')}
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="plus-circle"></i> Додати продукт</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <input class="stub-input" id="pantry-item-name" placeholder="Назва..." style="max-width:140px;" />
          <input class="stub-input" id="pantry-item-qty" placeholder="К-ть" type="number" value="1" style="max-width:60px;" />
          <input class="stub-input" id="pantry-item-unit" placeholder="Одиниця" value="шт" style="max-width:60px;" />
          <input class="stub-input" id="pantry-item-exp" type="date" style="max-width:140px;" />
          <button class="stub-btn stub-btn--primary" data-action="add-item">Додати</button>
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="map-pin"></i> Локації (${locEntries.length})</div>
        ${locEntries.map(([id, loc]) => `
          <div class="stub-row">
            <span>${loc.name}</span>
            <div style="display:flex;gap:4px;">
              <button class="stub-btn" data-action="edit-location" data-id="${id}" style="font-size:0.65rem;">Ред.</button>
              <button class="stub-btn stub-btn--danger" data-action="delete-location" data-id="${id}" style="font-size:0.65rem;">✕</button>
            </div>
          </div>
        `).join('')}
        <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
          <input class="stub-input" id="pantry-loc-name" placeholder="Нова локація..." style="max-width:180px;" />
          <button class="stub-btn" data-action="add-location">Додати</button>
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
      } else if (action === 'add-item') {
        const name = this.$('#pantry-item-name')?.value;
        const quantity = parseInt(this.$('#pantry-item-qty')?.value || '1');
        const unit = this.$('#pantry-item-unit')?.value || 'шт';
        const expiration_date = this.$('#pantry-item-exp')?.value || '';
        if (name) {
          await PantryService.addItem({ name, quantity, unit, expiration_date });
          await this._loadData();
        }
      } else if (action === 'delete-item') {
        await PantryService.deleteItem(btn.dataset.id);
        await this._loadData();
      } else if (action === 'add-location') {
        const name = this.$('#pantry-loc-name')?.value;
        if (name) {
          await PantryService.addLocation({ name });
          await this._loadData();
        }
      } else if (action === 'delete-location') {
        await PantryService.deleteLocation(btn.dataset.id);
        await this._loadData();
      } else if (action === 'edit-item') {
        const newQty = prompt("Нова кількість товару:");
        if (newQty && !isNaN(newQty)) {
          await PantryService.updateItem(btn.dataset.id, { quantity: parseInt(newQty) });
          await this._loadData();
        }
      } else if (action === 'edit-location') {
        const newName = prompt("Нова назва локації:");
        if (newName) {
          await PantryService.updateLocation(btn.dataset.id, { name: newName });
          await this._loadData();
        }
      }
    } catch (err) {
      console.warn('[PantryStub] Action error:', err);
    }
  }
}
