import Component from '../../core/Component.js';
import { RecipeService, CategoryService } from '../../core/ApiClient.js';
import { supabase } from '../../core/supabaseClient.js';
import { resolveMediaUrl } from '../../core/mediaResolver.js';
import ArcLightbox from '../ui_kit/arc_lightbox/ArcLightbox.js';

export default class RecipeCreateForm extends Component {
  constructor(props = {}) {
    super(props);
    this.onCreated = props.onCreated || (() => { });
    this.onClose = props.onClose || (() => { });
    this.recipeId = props.recipeId || null;
    this.recipeData = props.recipeData || null;
    this.isEdit = !!this.recipeId;
    
    // Support legacy "category" string, or modern "categories" array
    let initialCats = [];
    if (this.recipeData?.categories && Array.isArray(this.recipeData.categories) && this.recipeData.categories.length > 0) {
      initialCats = this.recipeData.categories;
    } else if (this.recipeData?.category) {
      // Legacy: category is a comma-separated string like "Seafood, 15"
      initialCats = this.recipeData.category.split(',').map(s => s.trim()).filter(Boolean);
    }
    this.selectedCategories = new Set(initialCats);
    this.allCategories = []; // Will fetch from API
    
    this.selectedIcon = 'help-circle';
    this.selectedFiles = []; // Store up to 20 raw File objects
  }

  async template() {
    return `
      <div class="rcf-right-page book-page-container">
        <div class="book-page-header" style="justify-content: space-between;">
          <h2 class="rcf-title" id="rcf-title-h2"><i data-lucide="feather" style="width:18px;margin-right:6px;"></i>Новий рецепт</h2>
          <button class="rcf-close" id="rcf-close" type="button"><i data-lucide="x" style="width:18px;"></i></button>
        </div>

        <div class="book-page-scroll-spine-left">
          <div class="rcf-form">

            <!-- Photo upload area -->
            <div class="rcf-photo-uploader" id="rcf-photo-uploader">
              <input type="file" id="rcf-file-input" multiple accept="image/*" style="display:none">
              <div class="rcf-photo-uploader-header" style="display:flex;gap:8px;align-items:stretch;">
                <div class="rcf-photo-area" id="rcf-photo-area" style="flex:1;">
                  <i data-lucide="camera" style="width:32px;height:32px;opacity:0.4;"></i>
                  <span class="rcf-photo-label">Завантажити фото</span>
                  <span class="rcf-photo-hint">Перетягніть, клікніть або Ctrl+V (до 20 фото, макс. 4MB)</span>
                </div>
                <button type="button" class="rcf-photo-paste" id="rcf-photo-paste" title="Вставити з буфера">
                  <i data-lucide="clipboard-paste" style="width:24px;height:24px;opacity:0.7;"></i>
                </button>
              </div>
              <div class="rcf-photo-grid" id="rcf-photo-grid"></div>
            </div>

            <input type="text" id="rcf-name" class="rcf-input rcf-input--title" placeholder="Назва рецепту">
            <input type="text" id="rcf-subtitle" class="rcf-input" placeholder="Короткий опис">

            <h3 class="rcf-section-title">Категорії (<span id="rcf-cat-count">${this.selectedCategories.size}</span>)</h3>
            <div class="rcf-cat-inline-add" style="display:flex; gap:8px; margin-bottom: 12px;">
              <input type="text" id="rcf-new-cat-input" class="rcf-input" placeholder="Нова категорія (напр. 'Домашня')" style="flex:1;">
              <button type="button" id="rcf-add-cat-btn" class="rcf-add-btn" style="width:auto; margin:0;"><i data-lucide="plus" style="width:16px;"></i> Додати</button>
            </div>
            <div id="rcf-cat-dynamic-mount">
              <div style="opacity:0.5; font-size:0.8rem; text-align:center; padding:12px;">Завантаження категорій...</div>
            </div>

            <div class="rcf-stats-row">
              <div class="rcf-stat"><i data-lucide="clock" style="width:14px;"></i><input type="text" id="rcf-time" placeholder="45 хв"></div>
              <div class="rcf-stat"><i data-lucide="users" style="width:14px;"></i><input type="text" id="rcf-portions" placeholder="4 порції"></div>
            </div>

            <h3 class="rcf-section-title">Інгредієнти</h3>
            <div id="rcf-ingredients">
              <div class="rcf-ing-row">
                <input type="text" class="rcf-ing-name" placeholder="Інгредієнт">
                <input type="text" class="rcf-ing-amount" placeholder="К-сть">
                <button type="button" class="rcf-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
              </div>
            </div>
            <button type="button" class="rcf-add-btn" id="rcf-add-ing"><i data-lucide="plus" style="width:12px;"></i> Додати інгредієнт</button>

            <h3 class="rcf-section-title">Кроки приготування</h3>
            <div id="rcf-steps">
              <div class="rcf-step-row">
                <span class="rcf-step-num">01</span>
                <div class="rcf-step-fields">
                  <input type="text" placeholder="Назва кроку">
                  <textarea placeholder="Опис кроку..." rows="2"></textarea>
                </div>
                <button type="button" class="rcf-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
              </div>
            </div>
            <button type="button" class="rcf-add-btn" id="rcf-add-step"><i data-lucide="plus" style="width:12px;"></i> Додати крок</button>

            <h3 class="rcf-section-title">Секрет шефа</h3>
            <textarea id="rcf-secret" class="rcf-textarea" placeholder="Порада або секрет приготування..." rows="2"></textarea>

            <h3 class="rcf-section-title">Подача</h3>
            <textarea id="rcf-serving" class="rcf-textarea" placeholder="Рекомендації щодо подачі..." rows="2"></textarea>

            <div class="rcf-actions">
              <button type="button" class="rcf-cancel-btn" id="rcf-cancel">
                <i data-lucide="arrow-left" style="width:14px;"></i> Скасувати
              </button>
              <button type="button" class="rcf-submit arc-glyph arc-glyph--concave" id="rcf-submit">
                <i data-lucide="feather" style="width:16px;"></i> ${this.isEdit ? 'Оновити рецепт' : 'Створити рецепт'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });

    this.$('#rcf-close')?.addEventListener('click', () => this.onClose());
    this.$('#rcf-cancel')?.addEventListener('click', () => this.onClose());

    this._initPhotoUploader();

    this._loadCategories();

    this.$('#rcf-add-cat-btn')?.addEventListener('click', () => this._handleInlineCategoryAdd());
    this.$('#rcf-new-cat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._handleInlineCategoryAdd(); }
    });

    // Add ingredient row
    this.$('#rcf-add-ing')?.addEventListener('click', () => {
      const container = this.$('#rcf-ingredients');
      const row = document.createElement('div');
      row.className = 'rcf-ing-row';
      row.innerHTML = `
        <input type="text" class="rcf-ing-name" placeholder="Інгредієнт">
        <input type="text" class="rcf-ing-amount" placeholder="К-сть">
        <button type="button" class="rcf-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
      `;
      container.appendChild(row);
      if (window.lucide) lucide.createIcons({ root: row });
    });

    if (this.isEdit && this.recipeData) {
      if (this.$('#rcf-title-h2')) this.$('#rcf-title-h2').innerHTML = '<i data-lucide="feather" style="width:18px;margin-right:6px;"></i>Редагувати рецепт';
      if (this.$('#rcf-name')) this.$('#rcf-name').value = this.recipeData.title || '';
      if (this.$('#rcf-subtitle')) this.$('#rcf-subtitle').value = this.recipeData.description || this.recipeData.subtitle || '';
      if (this.$('#rcf-time')) this.$('#rcf-time').value = this.recipeData.time_str || '';
      if (this.$('#rcf-portions')) this.$('#rcf-portions').value = this.recipeData.portions_str || '';
      if (this.$('#rcf-secret')) this.$('#rcf-secret').value = this.recipeData.secret || '';
      if (this.$('#rcf-serving')) this.$('#rcf-serving').value = this.recipeData.serving_recommendation || '';
      
      // Load and display existing photos
      const photoGrid = this.$('#rcf-photo-grid');
      if (photoGrid && this.recipeData.media?.images?.length) {
        let photosHtml = '';
        const validUrls = [];
        this.recipeData.media.images.forEach((imgUuid, idx) => {
          let urlToUse = null;
          if (String(imgUuid).startsWith('http')) {
            urlToUse = resolveMediaUrl(imgUuid);
          } else {
            const mAssets = this.props.mediaAssets || [];
            const asset = mAssets.find(a => a.uuid === imgUuid);
            if (asset?.url) urlToUse = resolveMediaUrl(asset.url);
          }

          if (urlToUse) {
             validUrls.push(urlToUse);
             photosHtml += `
               <div class="rcf-photo-tile rcf-photo-existing" data-idx="${validUrls.length - 1}" data-uuid="${imgUuid}">
                 <img src="${urlToUse}" style="cursor:zoom-in;">
                 <button type="button" class="rcf-photo-del" title="Видалити" onclick="event.stopPropagation(); this.parentElement.remove(); window.dispatchEvent(new CustomEvent('remove-existing-photo', {detail: '${imgUuid}'}));"><i data-lucide="x" style="width:12px;height:12px"></i></button>
               </div>
             `;
          }
        });
        photoGrid.insertAdjacentHTML('beforeend', photosHtml);
        
        // Add lightbox listener to the image element specifically to avoid triggering when deleting
        photoGrid.querySelectorAll('.rcf-photo-existing img').forEach(img => {
           img.addEventListener('click', (e) => {
              e.stopPropagation();
              const parent = img.parentElement;
              const startIdx = parseInt(parent.dataset.idx, 10);
              const lb = new ArcLightbox({ images: validUrls, initialIndex: startIdx });
              lb.render(document.body, 'appendChild');
           });
        });
      }

      // Pre-fill ingredients
      const ingContainer = this.$('#rcf-ingredients');
      if (ingContainer && this.recipeData.ingredients?.length) {
        ingContainer.innerHTML = '';
        this.recipeData.ingredients.forEach(ing => {
          const row = document.createElement('div');
          row.className = 'rcf-ing-row';
          row.innerHTML = `
            <input type="text" class="rcf-ing-name" placeholder="Інгредієнт" value="${(ing.name || '').replace(/"/g, '&quot;')}">
            <input type="text" class="rcf-ing-amount" placeholder="К-сть" value="${(ing.amount || '').replace(/"/g, '&quot;')}">
            <button type="button" class="rcf-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
          `;
          ingContainer.appendChild(row);
        });
      }

      // Pre-fill steps
      const stepsContainer = this.$('#rcf-steps');
      if (stepsContainer && this.recipeData.steps?.length) {
        stepsContainer.innerHTML = '';
        this.recipeData.steps.forEach((step, idx) => {
          const row = document.createElement('div');
          row.className = 'rcf-step-row';
          row.innerHTML = `
            <span class="rcf-step-num">${String(idx + 1).padStart(2, '0')}</span>
            <div class="rcf-step-fields">
              <input type="text" placeholder="Назва кроку" value="${(step.title || '').replace(/"/g, '&quot;')}">
              <textarea placeholder="Опис кроку..." rows="2">${(step.text || '')}</textarea>
            </div>
            <button type="button" class="rcf-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
          `;
          stepsContainer.appendChild(row);
        });
      }

      if (window.lucide) {
         lucide.createIcons({ root: this.$('#rcf-title-h2') });
         if (ingContainer) lucide.createIcons({ root: ingContainer });
         if (stepsContainer) lucide.createIcons({ root: stepsContainer });
      }
    }

    // Add step row
    this.$('#rcf-add-step')?.addEventListener('click', () => {
      const container = this.$('#rcf-steps');
      const num = container.querySelectorAll('.rcf-step-row').length + 1;
      const row = document.createElement('div');
      row.className = 'rcf-step-row';
      row.innerHTML = `
        <span class="rcf-step-num">${String(num).padStart(2, '0')}</span>
        <div class="rcf-step-fields">
          <input type="text" placeholder="Назва кроку">
          <textarea placeholder="Опис кроку..." rows="2"></textarea>
        </div>
        <button type="button" class="rcf-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
      `;
      container.appendChild(row);
      if (window.lucide) lucide.createIcons({ root: row });
    });

    // Submit
    this.$('#rcf-submit')?.addEventListener('click', () => this._submit());
  }

  _initPhotoUploader() {
    const area = this.$('#rcf-photo-area');
    const input = this.$('#rcf-file-input');
    if (!area || !input) return;

    // Click to open dialog
    area.addEventListener('click', () => input.click());

    // Drag and drop
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.style.borderColor = 'var(--gold)';
      area.style.background = 'rgba(197, 160, 68, 0.1)';
    });

    area.addEventListener('dragleave', (e) => {
      e.preventDefault();
      area.style.borderColor = '';
      area.style.background = '';
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.style.borderColor = '';
      area.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this._handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this._handleFiles(Array.from(e.target.files));
      }
      input.value = ''; // reset
    });

    // Paste button click
    const pasteBtn = this.$('#rcf-photo-paste');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const items = await navigator.clipboard.read();
          let files = [];
          for (const item of items) {
            const imageTypes = item.types.filter(type => type.startsWith('image/'));
            for (const type of imageTypes) {
              const blob = await item.getType(type);
              const file = new File([blob], `pasted_image_${Date.now()}.${type.split('/')[1]}`, { type });
              files.push(file);
            }
          }
          if (files.length > 0) this._handleFiles(files);
          else alert('В буфері немає зображень.');
        } catch (e) {
          console.error(e);
          alert('Немає доступу до буферу обміну або він порожній.');
        }
      });
    }

    // Global paste Ctrl+V logic scoped to this component lifetime
    this._pasteHandler = (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let files = [];
      for (let item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          files.push(blob);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        this._handleFiles(files);
      }
    };
    document.addEventListener('paste', this._pasteHandler);
  }

  onDestroy() {
    if (this._pasteHandler) {
      document.removeEventListener('paste', this._pasteHandler);
    }
  }

  _handleFiles(files) {
    let addedAny = false;
    
    for (const f of files) {
      if (this.selectedFiles.length >= 20) {
        alert('Максимальна кількість фотографій — 20.');
        break;
      }
      if (!f.type.startsWith('image/')) continue;
      
      const MAX_MB = 4;
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`Файл ${f.name} завеликий! Максимум ${MAX_MB}MB.`);
        continue;
      }

      this.selectedFiles.push(f);
      addedAny = true;
    }

    if (addedAny) {
      this._renderPhotoGrid();
    }
  }

  _renderPhotoGrid() {
    const grid = this.$('#rcf-photo-grid');
    if (!grid) return;
    
    // Remove only NEW file tiles (not existing .rcf-photo-existing tiles!)
    grid.querySelectorAll('.rcf-photo-tile:not(.rcf-photo-existing)').forEach(el => el.remove());
    
    this.selectedFiles.forEach((file, index) => {
      const tile = document.createElement('div');
      tile.className = 'rcf-photo-tile rcf-photo-new';
      
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      
      const delBtn = document.createElement('button');
      delBtn.className = 'rcf-photo-del';
      delBtn.title = 'Видалити';
      delBtn.innerHTML = '<i data-lucide="x" style="width:12px;height:12px"></i>';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.selectedFiles.splice(index, 1);
        this._renderPhotoGrid();
      };
      
      tile.appendChild(img);
      tile.appendChild(delBtn);
      grid.appendChild(tile);
    });

    if (window.lucide) lucide.createIcons({ root: grid });
  }

  async _uploadPhotosAndGetUUIDs(session) {
    if (this.selectedFiles.length === 0) return [];
    
    // Upload photos through Django Backend → Local Supabase Storage
    // Django forwards file to kong:8000 (local Docker Supabase Storage container)
    // and creates a MediaAsset record. Returns { uuid, url }.
    const { apiFetch } = await import('../../core/ApiClient.js');
    const uuids = [];
    
    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      // Link to existing recipe if editing
      if (this.recipeId) {
        formData.append('recipe_id', this.recipeId);
      }
      
      try {
        const resp = await apiFetch('/media/upload/', {
          method: 'POST',
          body: formData,
          // rawResponse=true so we get the Response object, not auto-parsed JSON
          rawResponse: true,
        });
        
        if (resp && resp.ok) {
          const result = await resp.json();
          if (result.uuid) {
            uuids.push(result.uuid);  // Store UUID, NOT full URL
            console.log(`📸 Uploaded ${file.name} → UUID: ${result.uuid}`);
          }
        } else {
          console.error('Upload failed for', file.name, resp?.status);
        }
      } catch (e) {
        console.error('Failed to upload', file.name, e);
      }
    }
    
    return uuids;
  }

  async _loadCategories() {
    // Try fetch from backend API
    import('../../core/ApiClient.js').then(async ({ CategoryService }) => {
      try {
        const data = await CategoryService.fetchAll();
        if (data && Array.isArray(data)) {
           this.allCategories = data;
        } else {
           // Provide safe fallback UI if API is missing or empty
           this.allCategories = [
             { data: { name: 'Супи', icon: 'soup' } },
             { data: { name: "М'ясо", icon: 'beef' } },
             { data: { name: 'Птиця', icon: 'drumstick' } },
             { data: { name: 'Різне', icon: 'tag' } }
           ];
        }
      } catch(e) {
        this.allCategories = [{ data: { name: 'Різне', icon: 'tag' }}];
      }
      this._renderCategories();
    });
  }

  async _handleInlineCategoryAdd() {
    const input = this.$('#rcf-new-cat-input');
    const name = input?.value?.trim();
    if (!name) return;

    input.value = '';
    
    // Add to local state immediately for snappy UI
    this.selectedCategories.add(name);
    // Add to allCategories if not exists
    if (!this.allCategories.find(c => c.data?.name?.toLowerCase() === name.toLowerCase())) {
        this.allCategories.push({ data: { name: name, icon: 'tag' } });
        
        // Push remotely
        import('../../core/ApiClient.js').then(({ CategoryService }) => {
           CategoryService.create({ data: { name: name, icon: 'tag', group: 'Кастомні' } }).catch(console.error);
        });
    }

    this._renderCategories();
  }

  _renderCategories() {
    const mount = this.$('#rcf-cat-dynamic-mount');
    if (!mount) return;

    if (this.allCategories.length === 0) {
      mount.innerHTML = '<div style="opacity:0.5; font-size:0.8rem;">Немає доступних категорій. Додайте першу!</div>';
      return;
    }

    const counter = this.$('#rcf-cat-count');
    if(counter) counter.innerText = this.selectedCategories.size;

    // Grouping logic (if the object has data.group, group it. Else 'Інше')
    const grouped = {};
    for (const catObj of this.allCategories) {
      const g = catObj.data?.group || 'Інше';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(catObj);
    }

    let html = '';
    // Sort groups so that they look predictable.
    const sortedGroups = Object.keys(grouped).sort();
    for (const groupName of sortedGroups) {
       const catList = grouped[groupName];
       // Sort categories ALPHABETICALLY as per user request (instead of Selected First).
       catList.sort((a,b) => (a.data.name || '').localeCompare(b.data.name || ''));

       html += `<div style="margin-bottom: 24px;">`;
       if (groupName !== 'Інше' && groupName !== 'Кастомні' && Object.keys(grouped).length > 1) {
          html += `<div style="font-family: 'Cinzel', serif; font-size:0.8rem; color:var(--crimson, #8b1a1a); text-transform:uppercase; margin-bottom:8px; letter-spacing:1px; font-weight:bold;">${groupName}</div>`;
       }
       html += `<div class="rcf-cat-grid" style="display: flex; flex-wrap: wrap; gap: 8px;">`;
       
       for (const catObj of catList) {
          const catId = catObj.id; // DB ID if present
          const catName = catObj.data?.name || 'Без назви';
          const catIcon = catObj.data?.icon || 'tag';
          const isActive = this.selectedCategories.has(catName);
          
          const colorClass = isActive ? 'active' : '';
          
          html += `<div class="rcf-cat-wrap rcf-cat-btn ${colorClass}" data-cat="${catName}" data-id="${catId}" style="cursor:pointer;">
                     <i data-lucide="${catIcon}" style="width:14px; height:14px; opacity:0.8;"></i>
                     <span>${catName}</span>
                     <div class="rcf-cat-icon-btn rcf-cat-edit" title="Редагувати" style="margin-left:4px; padding:2px; display:inline-flex; align-items:center; opacity:0.6;">
                        <i data-lucide="pencil" style="width:12px; height:12px;"></i>
                     </div>
                     <div class="rcf-cat-icon-btn rcf-cat-del" title="Видалити" style="padding:2px; display:inline-flex; align-items:center; opacity:0.6;">
                        <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                     </div>
                   </div>`;
       }
       html += `</div></div>`;
    }

    mount.innerHTML = html;

    if (window.lucide) lucide.createIcons({ root: mount });

    // Event listeners
    const wraps = mount.querySelectorAll('.rcf-cat-wrap');
    wraps.forEach(wrap => {
      // Toggle category selection
      wrap.addEventListener('click', (e) => {
         // Do not toggle if they clicked on Edit or Delete.
         if (e.target.closest('.rcf-cat-icon-btn')) return;
         
         const catName = wrap.dataset.cat;
         if (this.selectedCategories.has(catName)) {
            this.selectedCategories.delete(catName);
         } else {
            this.selectedCategories.add(catName);
         }
         this._renderCategories();
      });

      // Edit Category
      const editBtn = wrap.querySelector('.rcf-cat-edit');
      if (editBtn) {
         editBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const catName = wrap.dataset.cat;
            const catId = wrap.dataset.id;
            const newName = prompt("Введіть нову назву для категорії:", catName);
            if (newName && newName.trim() && newName.trim() !== catName) {
               
               // Update locally immediately
               const trimmed = newName.trim();
               const catRef = this.allCategories.find(c => c.data?.name === catName);
               if (catRef) catRef.data.name = trimmed;
               
               if (this.selectedCategories.has(catName)) {
                  this.selectedCategories.delete(catName);
                  this.selectedCategories.add(trimmed);
               }

               this._renderCategories();

               // Sync remotely
               if (catId && catId !== 'undefined') {
                  const CategoryService = (await import('../../core/ApiClient.js')).CategoryService;
                  try {
                    await CategoryService.update(catId, { data: catRef.data });
                  } catch(err) { console.error('Failed to update category', err); }
               }
            }
         });
      }

      // Delete Category
      const delBtn = wrap.querySelector('.rcf-cat-del');
      if (delBtn) {
         delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const catName = wrap.dataset.cat;
            const catId = wrap.dataset.id;
            if (!confirm(`Ви точно хочете видалити категорію "${catName}"? Рецепти, що належать їй, перейдуть у "Забуті категорії".`)) return;

            // Remove locally
            this.allCategories = this.allCategories.filter(c => c.data?.name !== catName);
            this.selectedCategories.delete(catName);
            this._renderCategories();

            // Sync remotely
            if (catId && catId !== 'undefined') {
               const CategoryService = (await import('../../core/ApiClient.js')).CategoryService;
               try {
                 await CategoryService.delete(catId);
                 // Emit global event to inform RecipeBookLeftPage to refresh!
                 window.dispatchEvent(new CustomEvent('eatpan-categories-changed'));
               } catch(err) { console.error('Failed to delete category', err); }
            }
         });
      }
    });
  }


  async _submit() {
    // Auth guard — only logged-in users can create recipes
    const { data: { session } } = await supabase.auth.getSession();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!session && !isLocal) {
      alert('Для створення рецепту потрібно увійти в акаунт.');
      return;
    }

    const title = this.$('#rcf-name')?.value?.trim();
    if (!title) { alert('Введіть назву рецепту!'); return; }

    const subtitle = this.$('#rcf-subtitle')?.value?.trim() || '';
    const timeStr = this.$('#rcf-time')?.value?.trim() || '';
    const portions = this.$('#rcf-portions')?.value?.trim() || '';
    const secret = this.$('#rcf-secret')?.value?.trim() || '';
    const serving = this.$('#rcf-serving')?.value?.trim() || '';

    const ingredients = [];
    this.$$('.rcf-ing-row').forEach(row => {
      const name = row.querySelector('.rcf-ing-name')?.value?.trim();
      const amount = row.querySelector('.rcf-ing-amount')?.value?.trim();
      if (name) ingredients.push({ name, amount: amount || '' });
    });

    const steps = [];
    this.$$('.rcf-step-row').forEach((row, i) => {
      const fields = row.querySelector('.rcf-step-fields');
      const stepTitle = fields?.querySelector('input')?.value?.trim() || `Крок ${i + 1}`;
      const text = fields?.querySelector('textarea')?.value?.trim() || '';
      if (text) steps.push({ num: i + 1, title: stepTitle, text });
    });

    const data = {
      title,
      subtitle,
      categories: Array.from(this.selectedCategories),
      category: Array.from(this.selectedCategories).join(', '), // Store gracefully for backward compatibility mode if schema remains string
      time_str: timeStr,
      portions_str: portions,
      secret,
      serving_recommendation: serving,
      ingredients,
      steps,
      books: ['Усі рецепти'],
    };



    const btn = this.$('#rcf-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" style="width:16px;animation:spin 1s linear infinite;"></i> Збереження...';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ root: btn });

    // 1. Upload photos first
    try {
      const uploadedImageUuids = await this._uploadPhotosAndGetUUIDs(session);
      
      // Determine existing surviving photos
      const photoGrid = this.$('#rcf-photo-grid');
      let survivingImages = [];
      if (photoGrid) {
        photoGrid.querySelectorAll('.rcf-photo-existing').forEach(tile => {
           const uuid = tile.getAttribute('data-uuid');
           if (uuid) survivingImages.push(uuid);
        });
      }

      if (uploadedImageUuids.length > 0 || survivingImages.length > 0) {
        data.media = {
          images: [...survivingImages, ...uploadedImageUuids]
        };
      } else {
        data.media = { images: [] };
      }
    } catch (e) {
      console.error('Photo upload failed:', e);
      alert('Помилка при завантаженні фото.');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    // 2. Transmit recipe data to backend
    let result;
    if (this.isEdit) {
      // In edit mode we patch the recipe
      result = await RecipeService.update(this.recipeId, data);
    } else {
      result = await RecipeService.create(data);
    }
    
    if (result && result.id) {
      console.log('✅ Recipe saved:', result.id);
      this.onCreated(result);
    } else {
      alert('Помилка при створенні рецепту. Перевірте авторизацію.');
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons({ root: btn });
    }
  }
}
