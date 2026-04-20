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
      <div class="stub-sector-root" style="padding:24px; height:100%; overflow-y:auto; font-family:var(--font-body, 'EB Garamond', serif); background-color: var(--bg-parchment, #f4e8d1); color: var(--c-ink-primary, #2c1b18); background-image: var(--parchment-texture); box-sizing: border-box;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px; border-bottom: 2px solid var(--c-ink-light, #d2b48c); padding-bottom: 12px;">
          <h2 style="font-family:var(--font-title, 'Cinzel', serif);color:var(--c-accent-gold, #b8860b);font-size:1.8rem;margin:0; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
            <i data-lucide="list-todo" style="width:28px;height:28px;vertical-align:middle;margin-right:10px;"></i>
            Списки покупок
          </h2>
          <button class="stub-btn" data-action="refresh" style="background:var(--c-ink-primary); color:var(--bg-parchment); border:1px solid var(--c-accent-gold); padding:8px 16px; font-family:var(--font-title); border-radius:4px; cursor:pointer;">
            <i data-lucide="refresh-cw" style="width:16px;height:16px; vertical-align: middle;"></i> Оновити
          </button>
        </div>
        <div id="shopping-content"><div style="text-align:center; font-style:italic; padding: 40px; color: var(--c-ink-light);">Завантаження...</div></div>
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
      <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; max-width: 1200px; margin: 0 auto;">
          <div style="display:flex; flex-direction:column; gap: 24px;">
              <div class="stub-section" style="background: rgba(255,255,255,0.4); border: 1px solid var(--c-ink-light); border-radius: 8px; padding: 20px;">
                <div style="font-family: var(--font-title); font-size: 1.4rem; color: var(--c-ink-primary); border-bottom: 1px solid var(--c-ink-light); margin-bottom: 16px; padding-bottom: 8px;"><i data-lucide="shopping-cart"></i> Мої списки (${entries.length})</div>
                ${entries.length === 0
                  ? '<div style="font-style:italic; color:var(--c-ink-light);">Створіть перший список</div>'
                  : entries.map(([id, lst]) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 8px; cursor:pointer;" data-action="select-list" data-id="${id}">
                      <span>
                        <strong style="font-size: 1.1rem; color: ${this.activeList === id ? 'var(--c-accent-gold)' : 'var(--c-ink-primary)'}">${lst.name}</strong>
                        <span style="opacity:0.7;font-size:0.9rem;margin-left:8px; font-style:italic;">${lst.remaining || 0}/${lst.total_items || 0}</span>
                      </span>
                      <div style="display:flex;gap:4px;">
                        <button data-action="edit-list" data-id="${id}" style="background:transparent; border:1px solid var(--c-ink-primary); color:var(--c-ink-primary); cursor:pointer; padding: 4px 8px; border-radius: 4px;">Ред.</button>
                        <button data-action="delete-list" data-id="${id}" style="background:transparent; border:1px solid #8b0000; color:#8b0000; cursor:pointer; padding: 4px 8px; border-radius: 4px;">✕</button>
                      </div>
                    </div>
                  `).join('')}
              </div>

              <div class="stub-section" style="background: rgba(255,255,255,0.4); border: 1px solid var(--c-ink-light); border-radius: 8px; padding: 20px;">
                <div style="font-family: var(--font-title); font-size: 1.4rem; color: var(--c-ink-primary); border-bottom: 1px solid var(--c-ink-light); margin-bottom: 16px; padding-bottom: 8px;"><i data-lucide="plus-circle"></i> Новий список</div>
                <div style="display:flex;gap:12px;flex-direction:column;">
                  <input id="shopping-list-name" placeholder="Назва списку..." style="padding: 8px; border: 1px solid var(--c-ink-light); background: var(--bg-parchment); font-family: var(--font-body); font-size: 1rem; color: var(--c-ink-primary); border-radius: 4px;" />
                  <button data-action="create-list" style="background:var(--c-ink-primary); color:var(--bg-parchment); border:1px solid var(--c-accent-gold); padding:10px 16px; font-family:var(--font-title); border-radius:4px; cursor:pointer; font-size: 1.1rem; width: 100%;">Створити Список</button>
                </div>
              </div>
          </div>
          
          <div>
              ${this.activeList ? this._renderActiveList() : '<div style="text-align:center; padding: 40px; color: var(--c-ink-light); font-style:italic;">Оберіть список для перегляду</div>'}
          </div>
      </div>
    `;
  }

  _renderActiveList() {
    const listData = this.data?.lists?.[this.activeList] || {};
    const items = listData.items || {};
    const itemEntries = Object.entries(items);

    return `
      <div class="stub-section" style="background: rgba(255,255,255,0.4); border: 1px solid var(--c-ink-light); border-radius: 8px; padding: 20px;">
        <div style="font-family: var(--font-title); font-size: 1.6rem; color: var(--c-accent-gold); border-bottom: 2px solid var(--c-ink-light); margin-bottom: 16px; padding-bottom: 8px;"><i data-lucide="list"></i> ${listData.name || ''}</div>
        
        <div style="margin-bottom: 24px;">
            ${itemEntries.length === 0 ? '<div style="font-style:italic; color:var(--c-ink-light);">Список порожній</div>' : ''}
            ${itemEntries.map(([id, item]) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px 0; border-bottom: 1px dotted rgba(0,0,0,0.1);">
                  <label style="display:flex; align-items:center; gap: 12px; cursor:pointer; font-size: 1.1rem; flex:1;">
                    <input type="checkbox" ${item.purchased ? 'checked' : ''} data-action="toggle-item" data-listid="${this.activeList}" data-id="${id}" style="width: 18px; height: 18px; accent-color: var(--c-accent-gold);">
                    <span style="${item.purchased ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.name} <span style="opacity:0.7;font-style:italic;">(${item.quantity})</span></span>
                  </label>
                  <div style="display:flex;gap:4px;">
                    <button data-action="edit-item" data-listid="${this.activeList}" data-id="${id}" style="background:transparent; border:none; color:var(--c-ink-primary); cursor:pointer; text-decoration: underline;">Ред.</button>
                    <button data-action="delete-item-list" data-listid="${this.activeList}" data-id="${id}" style="background:transparent; border:none; color:#8b0000; cursor:pointer; text-decoration: underline;">✕</button>
                  </div>
                </div>
            `).join('')}
        </div>

        <div style="font-family: var(--font-title); font-size: 1.2rem; color: var(--c-ink-primary); border-bottom: 1px solid var(--c-ink-light); margin-bottom: 16px; padding-bottom: 8px;"><i data-lucide="plus"></i> Додати товар</div>
        <div style="display:flex;gap:12px; align-items:center;">
          <input type="hidden" id="item-list-uuid" value="${this.activeList || ''}" />
          <input id="item-name" placeholder="Назва товару..." style="flex:1; padding: 8px; border: 1px solid var(--c-ink-light); background: var(--bg-parchment); font-family: var(--font-body); font-size: 1rem; color: var(--c-ink-primary); border-radius: 4px;" />
          <input id="item-qty" type="number" value="1" style="width:60px; padding: 8px; border: 1px solid var(--c-ink-light); background: var(--bg-parchment); font-family: var(--font-body); font-size: 1rem; color: var(--c-ink-primary); border-radius: 4px;" />
          <button data-action="add-item" style="background:var(--c-ink-primary); color:var(--bg-parchment); border:1px solid var(--c-accent-gold); padding:8px 16px; font-family:var(--font-title); border-radius:4px; cursor:pointer;">Додати</button>
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
