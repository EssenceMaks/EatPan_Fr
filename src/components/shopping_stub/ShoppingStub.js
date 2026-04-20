/**
 * ShoppingStub — болванка для сектора "Lists"
 * Показывает списки покупок с товарами. CRUD через ShoppingService.
 */
import Component from '../../core/Component.js';
import { ShoppingService, RecipeService } from '../../core/ApiClient.js';
import ShoppingExport from './ShoppingExport.js';

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
      <div class="stub-sector-root" style="padding:16px; height:100%; overflow-y:auto; font-family:var(--font-body, 'EB Garamond', serif); background: radial-gradient(circle at center, var(--parchment-light, #f8f1e3) 0%, var(--parchment-dark, #e6d3b3) 120%); color: var(--c-ink-primary, #2c1b18); box-sizing: border-box; display: flex; flex-direction: column;">
        <div style="display:flex;justify-content:center;align-items:center;margin-bottom:12px; border-bottom: 2px solid rgba(26,15,4,0.2); padding-bottom: 12px; flex-shrink: 0; position:relative;">
          <h2 style="font-family:var(--font-title, 'Cinzel', serif);color:#1a0f04;font-size:2rem;margin:0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
            Списки Покупок
          </h2>
          <button class="stub-btn" data-action="refresh" style="position:absolute; right:0; background:var(--c-ink-primary); color:var(--bg-parchment); border:1px solid var(--c-accent-gold); padding:8px 16px; font-family:var(--font-title); border-radius:6px; cursor:pointer; font-size: 1rem; transition: opacity 0.2s;">
            <i data-lucide="refresh-cw" style="width:16px;height:16px; vertical-align: middle; margin-right: 4px;"></i> Оновити
          </button>
        </div>
        <style>
          .list-item-row .list-actions { opacity: 0; pointer-events: none; }
          .list-item-row:hover .list-actions { opacity: 1 !important; pointer-events: auto; }
          .qty-btn { background:rgba(26,15,4,0.05); border:1px solid rgba(26,15,4,0.1); border-radius:3px; color:#1a0f04; font-family:var(--font-title); padding:2px 6px; cursor:pointer; font-size:0.8rem; font-weight:bold; transition:all 0.1s; }
          .qty-btn:hover { background:rgba(26,15,4,0.15); border-color:rgba(26,15,4,0.3); }
        </style>
        <div id="shopping-content" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="text-align:center; font-style:italic; padding: 40px; color: var(--c-ink-light);">Завантаження...</div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    this.allIngredients = new Set();
    try {
      const recipesRes = await RecipeService.fetchAll();
      if (recipesRes && recipesRes.results) {
        recipesRes.results.forEach(r => {
          if (r.data && r.data.ingredients) {
            r.data.ingredients.forEach(i => {
              if (i.name) this.allIngredients.add(i.name.trim().toLowerCase());
            });
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load recipes for ingredients list', e);
    }
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
    if (this.activeList) {
      await this._loadActiveListDetails();
    }
  }

  async _loadActiveListDetails() {
    if (!this.activeList) return;
    try {
      const listDetails = await ShoppingService.fetchList(this.activeList);
      if (listDetails && this.data?.lists) {
        this.data.lists[this.activeList] = listDetails;
      }
    } catch (e) {
      console.error('Failed to fetch specific list details', e);
    }
    const el = this.$('#shopping-content');
    if (el) {
      el.innerHTML = this._renderContent();
      if (window.lucide) lucide.createIcons({ root: el });
    }
  }

  _renderContent() {
    if (this._error) return `<div class="stub-section"><div class="stub-json">${this._error}</div></div>`;

    const lists = this.data?.lists || {};
    // Sort lists by creation date descending (assuming UUID v4 or simple string fallback, 
    // ideally we'd sort by created_at if API provides it. For now, just object entries).
    const entries = Object.entries(lists).reverse();

    return `
      <div style="display: flex; gap: 20px; height: 100%; overflow: hidden;">
          <!-- 1/5 Column: Lists -->
          <div style="flex: 0 0 250px; display:flex; flex-direction:column; gap: 16px; overflow-y: auto; padding-right: 4px;">
              
              <div style="background: rgba(26,15,4,0.05); border: 1px solid rgba(26,15,4,0.1); border-radius: 8px; padding: 12px;">
                <div style="display:flex;gap:8px;flex-direction:column;">
                  <input id="shopping-list-name" placeholder="Назва нового списку..." style="padding: 8px; border: 1px solid rgba(26,15,4,0.2); background: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 0.95rem; color: #1a0f04; border-radius: 4px; outline:none;" />
                  <button data-action="create-list" style="background:#1a0f04; color:#f8f1e3; border:none; padding:8px 12px; font-family:var(--font-title); font-weight:bold; border-radius:4px; cursor:pointer; font-size: 0.95rem; width: 100%; transition: opacity 0.2s;">
                    + Створити
                  </button>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap: 8px;">
                <div style="font-family: var(--font-title); font-size: 1.1rem; font-weight:bold; color: #1a0f04; margin-bottom: 4px; padding-left: 4px; border-bottom: 1px solid rgba(26,15,4,0.1); padding-bottom: 4px;">
                  Мої списки (${entries.length})
                </div>
                ${entries.length === 0
                  ? '<div style="font-style:italic; color:rgba(26,15,4,0.5); padding: 8px;">Немає списків</div>'
                  : entries.map(([id, lst]) => {
                      const isActive = this.activeList === id;
                      const activeStyle = isActive ? 'background: rgba(26,15,4,0.1); border-color: rgba(26,15,4,0.3); transform: translateX(2px);' : 'background: rgba(255,255,255,0.4); border-color: rgba(26,15,4,0.1);';
                      return `
                      <div class="list-item-row" style="display:flex; justify-content:space-between; align-items:center; padding: 10px 12px; border: 1px solid transparent; border-radius: 6px; cursor:pointer; transition: all 0.2s; ${activeStyle}" data-action="select-list" data-id="${id}">
                        <div style="display:flex; flex-direction:column; overflow:hidden;">
                          <strong style="font-size: 1.05rem; color: #1a0f04; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-title);">
                            ${lst.name}
                          </strong>
                          <span style="opacity:0.6; font-size:0.8rem; font-style:italic;">
                            Товарів: ${lst.total_items || Object.keys(lst.items || {}).length || 0}
                          </span>
                        </div>
                        <div class="list-actions" style="display:flex; gap:2px; flex-shrink: 0; transition: opacity 0.2s;">
                          <button data-action="edit-list" data-id="${id}" style="background:none; border:none; color:rgba(26,15,4,0.6); cursor:pointer; padding: 4px;" title="Редагувати">
                            <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                          </button>
                          <button data-action="delete-list" data-id="${id}" style="background:none; border:none; color:#991b1b; cursor:pointer; padding: 4px;" title="Видалити">
                            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
              </div>
          </div>
          
          <!-- 4/5 Column: Active List Details -->
          <div style="flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: rgba(255,255,255,0.2); border: 1px solid rgba(26,15,4,0.1); border-radius: 8px; padding: 16px;">
              ${this.activeList ? this._renderActiveList() : '<div style="flex:1; display:flex; align-items:center; justify-content:center; color: rgba(26,15,4,0.5); font-style:italic; font-size: 1.2rem; font-family: var(--font-title);">Оберіть список ліворуч</div>'}
          </div>
      </div>
    `;
  }

  _renderActiveList() {
    const listData = this.data?.lists?.[this.activeList] || {};
    const items = listData.items || {};
    const itemEntries = Object.entries(items);

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid rgba(26,15,4,0.1); margin-bottom: 16px; padding-bottom: 12px;">
        <div style="font-family: var(--font-title); font-size: 1.6rem; color: #1a0f04; font-weight:bold;">
          ${listData.name || 'Список покупок'}
        </div>
        <div style="display:flex; gap:8px;">
          <button data-action="export-copy-img" title="Копіювати як картинку" style="background: #1a0f04; color:#f8f1e3; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;"><i data-lucide="image" style="width:14px;height:14px;"></i></button>
          <button data-action="export-dl-img" title="Завантажити картинку" style="background: #1a0f04; color:#f8f1e3; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;"><i data-lucide="download" style="width:14px;height:14px;"></i></button>
          <button data-action="export-copy-txt" title="Копіювати текст" style="background: #1a0f04; color:#f8f1e3; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;"><i data-lucide="clipboard-copy" style="width:14px;height:14px;"></i></button>
          <button data-action="export-dl-txt" title="Завантажити текст" style="background: #1a0f04; color:#f8f1e3; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;"><i data-lucide="file-text" style="width:14px;height:14px;"></i></button>
        </div>
      </div>
      
      <!-- Container for Image Export -->
      <div id="export-list-container" style="flex:1; overflow-y:auto; padding: 8px; background: transparent;">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">
            ${itemEntries.length === 0 ? '<div style="grid-column: 1/-1; font-style:italic; color:rgba(26,15,4,0.5);">Список порожній</div>' : ''}
            ${itemEntries.map(([id, item]) => {
              const isChecked = item.purchased;
              const cardBg = isChecked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)';
              const cardBorder = isChecked ? 'rgba(26,15,4,0.05)' : 'rgba(26,15,4,0.15)';
              const textColor = isChecked ? 'rgba(26,15,4,0.4)' : '#1a0f04';
              const imgIcon = 'leaf'; // default icon
              
              return `
                <div class="shopping-item-card" data-id="${id}" style="display:flex; flex-direction:column; background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 12px; transition: all 0.2s; position:relative; overflow:hidden;">
                  
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
                    <label style="display:flex; align-items:flex-start; gap: 8px; cursor:pointer; flex:1;">
                      <div class="custom-checkbox" style="margin-top:2px;">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} data-action="toggle-item" data-listid="${this.activeList}" data-id="${id}" style="width: 18px; height: 18px; accent-color: #1a0f04; cursor:pointer;">
                      </div>
                      <div style="display:flex; flex-direction:column;">
                        <span class="item-name-text" style="font-family:var(--font-body); font-size:1.1rem; font-weight:600; color:${textColor}; line-height:1.2; ${isChecked ? 'text-decoration:line-through;' : 'text-decoration:none;'}">
                          ${item.name}
                        </span>
                        ${item.notes ? `<span class="item-info-text" style="font-size:0.75rem; color:${textColor}; font-family:var(--font-title); margin-top:2px;">${item.notes}</span>` : ''}
                      </div>
                    </label>
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(26,15,4,0.05);">
                    <div style="display:flex; align-items:center; gap: 6px; color:${textColor};">
                       <i class="item-info-text" data-lucide="${imgIcon}" style="width:14px;height:14px; opacity:0.7; color:${textColor};"></i>
                       <span class="item-info-text" style="font-weight:bold; font-size:0.95rem; color:${textColor};">x${item.quantity || 1}</span>
                       <div style="display:flex; gap: 2px; margin-left: 4px;">
                         <button class="qty-btn" data-action="mod-qty" data-mod="/2" data-listid="${this.activeList}" data-id="${id}">/2</button>
                         <button class="qty-btn" data-action="mod-qty" data-mod="-1" data-listid="${this.activeList}" data-id="${id}">-1</button>
                         <button class="qty-btn" data-action="mod-qty" data-mod="+1" data-listid="${this.activeList}" data-id="${id}">+1</button>
                         <button class="qty-btn" data-action="mod-qty" data-mod="x2" data-listid="${this.activeList}" data-id="${id}">x2</button>
                       </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button data-action="edit-item" data-listid="${this.activeList}" data-id="${id}" style="background:none; border:none; color:rgba(26,15,4,0.6); cursor:pointer; padding:2px;" title="Редагувати">
                        <i data-lucide="edit-2" style="width:12px;height:12px;"></i>
                      </button>
                      <button data-action="delete-item-list" data-listid="${this.activeList}" data-id="${id}" style="background:none; border:none; color:#991b1b; cursor:pointer; padding:2px;" title="Видалити">
                        <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>

      <div style="display:flex;gap:8px; align-items:center; padding-top: 12px; border-top: 1px solid rgba(26,15,4,0.1); margin-top:auto;">
        <input type="hidden" id="item-list-uuid" value="${this.activeList || ''}" />
        
        <datalist id="all-ingredients-list">
          ${Array.from(this.allIngredients || []).map(ing => `<option value="${ing}">`).join('')}
        </datalist>
        <input id="item-name" list="all-ingredients-list" placeholder="Назва товару..." style="flex:1; padding: 8px 12px; border: 1px solid rgba(26,15,4,0.2); background: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 1rem; color: #1a0f04; border-radius: 4px; outline:none;" />
        
        <input id="item-qty" type="number" value="1" min="0.1" step="0.1" style="width:60px; padding: 8px; border: 1px solid rgba(26,15,4,0.2); background: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 1rem; color: #1a0f04; border-radius: 4px; outline:none; text-align:center;" />
        <button data-action="add-item" style="background:#1a0f04; color:#f8f1e3; border:none; padding:8px 16px; font-family:var(--font-title); font-weight:bold; border-radius:4px; cursor:pointer;">
          + Додати
        </button>
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
        await this._loadActiveListDetails();
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
        // Optimistic UI for checkbox
        const card = btn.closest('.shopping-item-card');
        if (card) {
          card.style.background = isChecked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)';
          card.style.borderColor = isChecked ? 'rgba(26,15,4,0.05)' : 'rgba(26,15,4,0.15)';
          const textSpan = card.querySelector('.item-name-text');
          if (textSpan) {
            textSpan.style.textDecoration = isChecked ? 'line-through' : 'none';
            textSpan.style.color = isChecked ? 'rgba(26,15,4,0.4)' : '#1a0f04';
          }
          const infoElements = card.querySelectorAll('.item-info-text');
          infoElements.forEach(el => el.style.color = isChecked ? 'rgba(26,15,4,0.4)' : '#1a0f04');
        }
        
        // Update in background
        ShoppingService.updateItem(btn.dataset.listid, btn.dataset.id, { purchased: isChecked })
          .then(() => {
             // Silently update local data without full re-render
             if(this.data && this.data.lists[btn.dataset.listid] && this.data.lists[btn.dataset.listid].items[btn.dataset.id]) {
                 this.data.lists[btn.dataset.listid].items[btn.dataset.id].purchased = isChecked;
             }
          })
          .catch(e => {
             console.warn('Failed to update purchased status', e);
             this._loadData(); // Revert on failure
          });
      } else if (action === 'edit-item') {
        const newName = prompt("Нова назва товару:");
        if (newName) {
            await ShoppingService.updateItem(btn.dataset.listid, btn.dataset.id, { name: newName });
            await this._loadActiveListDetails();
        }
      } else if (action === 'mod-qty') {
        e.stopPropagation();
        const mod = btn.dataset.mod;
        const currentItem = this.data?.lists?.[btn.dataset.listid]?.items?.[btn.dataset.id];
        if (!currentItem) return;
        
        let currentQty = parseFloat(currentItem.quantity || 1);
        if (isNaN(currentQty)) currentQty = 1;
        
        let newQty = currentQty;
        if (mod === '/2') newQty = currentQty / 2;
        else if (mod === 'x2') newQty = currentQty * 2;
        else if (mod === '+1') newQty = currentQty + 1;
        else if (mod === '-1') newQty = currentQty - 1;
        
        if (newQty < 0.1) newQty = 0.1;
        // round to 1 decimal to avoid long floats like 0.3333333333
        newQty = Math.round(newQty * 10) / 10;
        
        // Optimistic UI
        currentItem.quantity = newQty;
        const el = this.$('#shopping-content');
        if (el) {
          el.innerHTML = this._renderContent();
          if (window.lucide) lucide.createIcons({ root: el });
        }
        
        // Update in background
        await ShoppingService.updateItem(btn.dataset.listid, btn.dataset.id, { quantity: newQty });
      } else if (action === 'export-copy-img') {
        const container = this.element.querySelector('#export-list-container');
        if (container) await ShoppingExport.copyAsImage(container, btn);
      } else if (action === 'export-dl-img') {
        const container = this.element.querySelector('#export-list-container');
        if (container) await ShoppingExport.downloadAsImage(container, this.activeList, btn);
      } else if (action === 'export-copy-txt') {
        const items = this.data?.lists?.[this.activeList]?.items;
        await ShoppingExport.copyAsText(items);
      } else if (action === 'export-dl-txt') {
        const items = this.data?.lists?.[this.activeList]?.items;
        await ShoppingExport.downloadAsText(items, this.activeList);
      }
    } catch (err) {
      console.warn('[ShoppingStub]', err);
    }
  }
}
