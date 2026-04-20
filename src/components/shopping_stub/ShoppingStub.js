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
    this.allIngredients = [];
    this.editingListId = null;
    this.deletingListId = null;
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
          .autocomplete-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            color: #f8f1e3;
            cursor: pointer;
            font-family: var(--font-body);
            font-size: 0.95rem;
            transition: background 0.1s;
          }
          .autocomplete-item:hover {
            background: rgba(255,255,255,0.1);
          }
          .autocomplete-item-img {
            width: 32px;
            height: 32px;
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .alpha-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #f8f1e3;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--font-title);
            font-size: 0.85rem;
            transition: all 0.1s;
          }
          .alpha-btn:hover {
            background: rgba(255,255,255,0.2);
          }
          #custom-autocomplete-dropdown::-webkit-scrollbar {
            width: 8px;
          }
          #custom-autocomplete-dropdown::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
          }
          #custom-autocomplete-dropdown::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
          }
          #custom-autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.3);
          }
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
    
    // Prevent input blur when clicking inside the dropdown
    this.element.addEventListener('mousedown', (e) => {
      if (e.target.closest('#custom-autocomplete-dropdown')) {
        if (e.target.closest('.alpha-btn')) {
          e.preventDefault(); 
        }
      }
    });

    // Autocomplete events using event delegation
    this.element.addEventListener('input', (e) => {
      if (e.target.id === 'item-name') {
        this._updateAutocomplete(e.target.value);
      }
    });
    this.element.addEventListener('focusin', (e) => {
      if (e.target.id === 'item-name') {
        this._updateAutocomplete(e.target.value);
        const dd = this.$('#custom-autocomplete-dropdown');
        if (dd) dd.style.display = 'block';
      }
    });
    this.element.addEventListener('focusout', (e) => {
      if (e.target.id === 'item-name') {
        setTimeout(() => {
          const dd = this.$('#custom-autocomplete-dropdown');
          if (dd) dd.style.display = 'none';
        }, 150);
      }
    });

    try {
      const ings = await RecipeService.fetchIngredients();
      this.allIngredients = Array.isArray(ings) ? ings : (ings?.ingredients || []);
    } catch (e) {
      console.warn('Failed to load recipes for ingredients list', e);
    }
    
    // Listen for global shopping list updates (e.g. from MealPlanner)
    this._onShoppingListUpdated = () => {
      this._loadData();
    };
    window.addEventListener('shopping-list-updated', this._onShoppingListUpdated);

    await this._loadData();
  }

  onDestroy() {
    if (this._onShoppingListUpdated) {
      window.removeEventListener('shopping-list-updated', this._onShoppingListUpdated);
    }
    super.onDestroy();
  }

  async _loadData() {
    try {
      this.data = await ShoppingService.fetchAll();
      this._error = null;
      if (this.activeList) {
        await this._loadActiveListDetails();
      }
    } catch (err) {
      this._error = err.message || 'Помилка API';
    }
    this._reRenderLists();
  }

  async _loadActiveListDetails() {
    if (!this.activeList) return;
    try {
      const listDetails = await ShoppingService.fetchList(this.activeList);
      if (listDetails && this.data?.lists) {
        this.data.lists[this.activeList] = listDetails;
      }
    } catch (e) {
      console.error(e);
    }
  }

  _reRenderLists() {
    const el = this.$('#shopping-content');
    if (el) {
      el.innerHTML = this._renderContent();
      if (window.lucide) lucide.createIcons({ root: el });
    }
  }

  _renderContent() {
    if (this._error) return `<div class="stub-section"><div class="stub-json">${this._error}</div></div>`;

    const lists = this.data?.lists || {};
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
                      const activeStyle = isActive 
                        ? 'background: rgba(26,15,4,0.05); border-color: rgba(26,15,4,0.2);' 
                        : '';
                        
                      let innerContent = '';
                      if (this.editingListId === id) {
                        innerContent = `
                          <div style="display:flex; flex-direction:column; width:100%; gap: 6px;">
                            <input type="text" id="edit-list-input-${id}" value="${lst.name}" style="padding: 6px; border: 1px solid rgba(26,15,4,0.3); border-radius: 4px; font-family: var(--font-body); font-size: 0.95rem; background: rgba(255,255,255,0.8); color: #1a0f04; width: 100%; box-sizing: border-box; outline: none;" />
                            <div style="display:flex; gap: 6px;">
                              <button data-action="save-list-name" data-id="${id}" style="background: #166534; color: #f8f1e3; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-family: var(--font-title); font-size: 0.85rem; flex: 1;">Зберегти</button>
                              <button data-action="cancel-edit-list" style="background: #991b1b; color: #f8f1e3; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-family: var(--font-title); font-size: 0.85rem; flex: 1;">Скасувати</button>
                            </div>
                          </div>
                        `;
                      } else if (this.deletingListId === id) {
                        innerContent = `
                          <div style="display:flex; flex-direction:column; width:100%; gap: 6px;">
                            <span style="font-size: 0.9rem; color: #991b1b; font-family: var(--font-body); text-align: center; line-height: 1.2;">Ви дійсно бажаєте видалити цей список?</span>
                            <div style="display:flex; gap: 6px;">
                              <button data-action="confirm-delete-list" data-id="${id}" style="background: #991b1b; color: #f8f1e3; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-family: var(--font-title); font-size: 0.85rem; flex: 1;">Видалити</button>
                              <button data-action="cancel-delete-list" style="background: rgba(26,15,4,0.1); color: #1a0f04; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-family: var(--font-title); font-size: 0.85rem; flex: 1;">Ні</button>
                            </div>
                          </div>
                        `;
                      } else {
                        innerContent = `
                          <div style="display:flex; flex-direction:column; overflow:hidden;">
                            <strong style="font-size: 1.05rem; color: #1a0f04; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-title);">
                              ${lst.name}
                            </strong>
                            <span style="opacity:0.6; font-size:0.8rem; font-style:italic;">
                              Товарів: ${lst.total_items || Object.keys(lst.items || {}).length || 0}
                            </span>
                          </div>
                          <div class="list-actions" style="display:flex; gap:2px; flex-shrink: 0; transition: opacity 0.2s;">
                            <button data-action="edit-list-inline" data-id="${id}" style="background:none; border:none; color:rgba(26,15,4,0.6); cursor:pointer; padding: 4px;" title="Редагувати">
                              <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                            </button>
                            <button data-action="delete-list-inline" data-id="${id}" style="background:none; border:none; color:#991b1b; cursor:pointer; padding: 4px;" title="Видалити">
                              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                          </div>
                        `;
                      }

                      return `
                      <div class="list-item-row" style="display:flex; justify-content:space-between; align-items:center; padding: 10px 12px; border: 1px solid transparent; border-radius: 6px; cursor:pointer; transition: all 0.2s; ${activeStyle}" data-action="select-list" data-id="${id}">
                        ${innerContent}
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
        
        <div style="position:relative; flex:1; display:flex;">
          <input id="item-name" autocomplete="off" placeholder="Назва товару..." style="flex:1; padding: 8px 12px; border: 1px solid rgba(26,15,4,0.2); background: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 1rem; color: #1a0f04; border-radius: 4px; outline:none;" />
          <div id="custom-autocomplete-dropdown" style="display:none; position:absolute; bottom:100%; left:0; right:0; margin-bottom:4px; max-height:40vh; overflow-y:auto; background: var(--c-ink-primary, #1a0f04); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; box-shadow: 0 -4px 12px rgba(0,0,0,0.15); z-index: 1000; padding: 4px 0;">
             <!-- populated by JS -->
          </div>
        </div>
        
        <input id="item-qty" type="number" value="1" min="0.1" step="0.1" style="width:60px; padding: 8px; border: 1px solid rgba(26,15,4,0.2); background: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 1rem; color: #1a0f04; border-radius: 4px; outline:none; text-align:center;" />
        <button data-action="add-item" style="background:#1a0f04; color:#f8f1e3; border:none; padding:8px 16px; font-family:var(--font-title); font-weight:bold; border-radius:4px; cursor:pointer;">
          + Додати
        </button>
      </div>
    `;
  }

  _updateAutocomplete(query = '') {
    const dd = this.$('#custom-autocomplete-dropdown');
    if (!dd) return;
    const lowerQuery = query.toLowerCase().trim();
    
    // Sort all ingredients alphabetically
    let filtered = [...(this.allIngredients || [])].sort((a, b) => a.localeCompare(b));
    
    if (lowerQuery) {
      filtered = filtered.filter(ing => ing.toLowerCase().includes(lowerQuery));
    }
    
    if (filtered.length === 0) {
      dd.innerHTML = `<div style="padding: 8px 12px; color: rgba(255,255,255,0.5); font-size: 0.9rem; font-style: italic;">Нічого не знайдено</div>`;
      return;
    }

    const letters = [...new Set(filtered.map(i => i.charAt(0).toUpperCase()))];
    
    const alphaBarHtml = `
      <div style="position: sticky; top: 0; background: var(--c-ink-primary, #1a0f04); z-index: 10; padding: 6px 8px; display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 4px;">
         ${letters.map(l => `<button data-action="scroll-to-letter" data-letter="${l}" class="alpha-btn">${l}</button>`).join('')}
      </div>
    `;

    let currentLetter = '';
    let itemsHtml = '';
    
    filtered.forEach(ing => {
       const letter = ing.charAt(0).toUpperCase();
       if (letter !== currentLetter) {
          currentLetter = letter;
          itemsHtml += `<div id="alpha-group-${letter}" style="padding: 4px 12px; font-weight: bold; color: rgba(255,255,255,0.5); font-size: 0.8rem; background: rgba(255,255,255,0.05); margin-top: 4px; font-family: var(--font-title);">${letter}</div>`;
       }
       itemsHtml += `
         <div class="autocomplete-item" data-action="select-ingredient" data-value="${ing}">
           <div class="autocomplete-item-img">
             <i data-lucide="image" style="width:16px;height:16px;opacity:0.5;"></i>
           </div>
           <span>${ing}</span>
         </div>
       `;
    });

    dd.innerHTML = alphaBarHtml + itemsHtml;
    // Initialize icons in the newly created HTML
    if (window.lucide) lucide.createIcons({ root: dd });
  }

  async _handleAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    try {
      if (action === 'select-ingredient') {
        const input = this.$('#item-name');
        if (input) {
          input.value = btn.dataset.value;
          const dd = this.$('#custom-autocomplete-dropdown');
          if (dd) dd.style.display = 'none';
        }
      } else if (action === 'scroll-to-letter') {
        const letter = btn.dataset.letter;
        const target = this.$(`#alpha-group-${letter}`);
        const dd = this.$('#custom-autocomplete-dropdown');
        if (target && dd) {
          dd.scrollTop = target.offsetTop - 40;
        }
      } else if (action === 'refresh') {
        await this._loadData();
      } else if (action === 'create-list') {
        const name = this.$('#shopping-list-name')?.value;
        if (name) {
          await ShoppingService.createList({ name });
          await this._loadData();
        }
      } else if (action === 'edit-list-inline') {
        e.stopPropagation();
        this.editingListId = btn.dataset.id;
        this.deletingListId = null;
        this._reRenderLists();
      } else if (action === 'cancel-edit-list') {
        e.stopPropagation();
        this.editingListId = null;
        this._reRenderLists();
      } else if (action === 'save-list-name') {
        e.stopPropagation();
        const input = this.$(`#edit-list-input-${btn.dataset.id}`);
        if (input && input.value.trim()) {
          await ShoppingService.updateList(btn.dataset.id, { name: input.value.trim() });
          this.editingListId = null;
          await this._loadData();
        }
      } else if (action === 'delete-list-inline') {
        e.stopPropagation();
        this.deletingListId = btn.dataset.id;
        this.editingListId = null;
        this._reRenderLists();
      } else if (action === 'cancel-delete-list') {
        e.stopPropagation();
        this.deletingListId = null;
        this._reRenderLists();
      } else if (action === 'confirm-delete-list') {
        e.stopPropagation();
        await ShoppingService.deleteList(btn.dataset.id);
        if (this.activeList === btn.dataset.id) this.activeList = null;
        this.deletingListId = null;
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
        if (this.editingListId !== btn.dataset.id && this.deletingListId !== btn.dataset.id) {
          this.activeList = btn.dataset.id;
          await this._loadActiveListDetails();
          this._reRenderLists();
        }
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
