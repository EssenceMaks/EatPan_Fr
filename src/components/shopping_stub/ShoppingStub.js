/**
 * ShoppingStub — болванка для сектора "Lists"
 * Показывает списки покупок с товарами. CRUD через ShoppingService.
 */
import Component from '../../core/Component.js';
import { ShoppingService } from '../../core/ApiClient.js';

export default class ShoppingStub extends Component {
  constructor(props = {}) {
    super(props);
    this.data = null;
    this.activeList = null; // selected list UUID
    this.activeListData = null;
    this._error = null;
  }

  async template() {
    return `
      <div class="stub-sector-root" style="padding:16px; height:100%; overflow-y:auto; font-family:var(--font-body, sans-serif);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-family:var(--font-title);color:var(--text-accent);font-size:1.2rem;margin:0;">
            <i data-lucide="list-todo" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
            Списки покупок
          </h2>
          <button class="stub-btn stub-btn--primary" data-action="refresh">
            <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Оновити
          </button>
        </div>
        <div id="shopping-content"><div class="stub-loading">Завантаження...</div></div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    await this._loadData();
  }

  async _loadData() {
    const el = this.$('#shopping-content');
    if (!el) return;
    try {
      this.data = await ShoppingService.fetchAll();
      this._error = null;
    } catch (err) {
      this._error = err.message || 'Помилка API';
    }
    el.innerHTML = this._renderContent();
    if (window.lucide) lucide.createIcons({ root: el });
  }

  _renderContent() {
    if (this._error) return `<div class="stub-section"><div class="stub-json">${this._error}</div></div>`;

    const lists = this.data?.lists || {};
    const entries = Object.entries(lists);

    return `
      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="shopping-cart"></i> Мої списки (${entries.length})</div>
        ${entries.length === 0
          ? '<div class="stub-loading">Створіть перший список</div>'
          : entries.map(([id, lst]) => `
            <div class="stub-row" style="cursor:pointer;" data-action="select-list" data-id="${id}">
              <span>
                <strong>${lst.name}</strong>
                <span style="opacity:0.5;font-size:0.75rem;margin-left:6px;">${lst.remaining || 0}/${lst.total_items || 0}</span>
              </span>
              <div style="display:flex;gap:4px;">
                <button class="stub-btn" data-action="edit-list" data-id="${id}" style="font-size:0.65rem;">Ред.</button>
                <button class="stub-btn stub-btn--danger" data-action="delete-list" data-id="${id}" style="font-size:0.65rem;">✕</button>
              </div>
            </div>
          `).join('')}
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="plus-circle"></i> Новий список</div>
        <div style="display:flex;gap:6px;align-items:center;">
          <input class="stub-input" id="shopping-list-name" placeholder="Назва списку..." style="max-width:200px;" />
          <button class="stub-btn stub-btn--primary" data-action="create-list">Створити</button>
        </div>
      </div>

      ${this.activeList ? this._renderActiveList() : ''}

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="plus"></i> Додати товар у список</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <input class="stub-input" id="item-list-uuid" placeholder="UUID списку..." style="max-width:280px;" value="${this.activeList || ''}" />
          <input class="stub-input" id="item-name" placeholder="Назва товару..." style="max-width:140px;" />
          <input class="stub-input" id="item-qty" type="number" value="1" style="max-width:50px;" />
          <button class="stub-btn stub-btn--primary" data-action="add-item">Додати</button>
        </div>
      </div>
    `;
  }

  _renderActiveList() {
    const listData = this.data?.lists?.[this.activeList] || {};
    const items = listData.items || {};
    const itemEntries = Object.entries(items);

    return `
      <div class="stub-section" style="border-left:3px solid var(--accent-primary, #8b4513);">
        <div class="stub-section__title"><i data-lucide="list"></i> Товари списку: ${listData.name || ''}</div>
        ${itemEntries.length === 0 ? '<div class="stub-loading">Список порожній</div>' : ''}
        ${itemEntries.map(([id, item]) => `
            <div class="stub-row">
              <span>
                <input type="checkbox" ${item.purchased ? 'checked' : ''} data-action="toggle-item" data-listid="${this.activeList}" data-id="${id}">
                <span style="${item.purchased ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.name} (${item.quantity})</span>
              </span>
              <div style="display:flex;gap:4px;">
                <button class="stub-btn" data-action="edit-item" data-listid="${this.activeList}" data-id="${id}" style="font-size:0.65rem;">Ред.</button>
                <button class="stub-btn stub-btn--danger" data-action="delete-item-list" data-listid="${this.activeList}" data-id="${id}" style="font-size:0.65rem;">✕</button>
              </div>
            </div>
        `).join('')}
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
      } else if (action === 'create-list') {
        const name = this.$('#shopping-list-name')?.value;
        if (name) {
          await ShoppingService.createList({ name });
          await this._loadData();
        }
      } else if (action === 'delete-list') {
        await ShoppingService.deleteList(btn.dataset.id);
        if (this.activeList === btn.dataset.id) this.activeList = null;
        await this._loadData();
      } else if (action === 'add-item') {
        const listUuid = this.$('#item-list-uuid')?.value;
        const name = this.$('#item-name')?.value;
        const quantity = parseInt(this.$('#item-qty')?.value || '1');
        if (listUuid && name) {
          await ShoppingService.addItem(listUuid, { name, quantity });
          await this._loadData();
        }
      } else if (action === 'select-list') {
        this.activeList = btn.dataset.id;
        await this._loadData();
      } else if (action === 'edit-list') {
        const newName = prompt("Нова назва списку:");
        if (newName) {
            await ShoppingService.updateList(btn.dataset.id, { name: newName });
            await this._loadData();
        }
      } else if (action === 'delete-item-list') {
        await ShoppingService.deleteItem(btn.dataset.listid, btn.dataset.id);
        await this._loadData();
      } else if (action === 'toggle-item') {
        const isChecked = btn.checked;
        await ShoppingService.updateItem(btn.dataset.listid, btn.dataset.id, { purchased: isChecked });
        await this._loadData();
      } else if (action === 'edit-item') {
        const newName = prompt("Нова назва товару:");
        if (newName) {
            await ShoppingService.updateItem(btn.dataset.listid, btn.dataset.id, { name: newName });
            await this._loadData();
        }
      }
    } catch (err) {
      console.warn('[ShoppingStub]', err);
    }
  }
}
