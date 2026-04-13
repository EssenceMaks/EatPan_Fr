import Component from '../../core/Component.js';
import { RecipeService } from '../../core/ApiClient.js';
import { supabase } from '../../core/supabaseClient.js';

export default class RecipeCreateForm extends Component {
  constructor(props = {}) {
    super(props);
    this.onCreated = props.onCreated || (() => { });
    this.onClose = props.onClose || (() => { });
    this.selectedCategory = '';
    this.selectedIcon = 'help-circle';
  }

  async template() {
    const categories = [
      { icon: 'soup', label: 'Супи' },
      { icon: 'beef', label: "М'ясо" },
      { icon: 'drumstick', label: 'Птиця' },
      { icon: 'fish', label: 'Риба' },
      { icon: 'shrimp', label: 'Морепродукти' },
      { icon: 'utensils', label: 'Паста' },
      { icon: 'leaf', label: 'Салати' },
      { icon: 'wheat', label: 'Випічка' },
      { icon: 'cake-slice', label: 'Десерти' },
      { icon: 'coffee', label: 'Напої' },
    ];

    const catBtns = categories.map(c =>
      `<button class="rcf-cat-btn" type="button" data-cat="${c.label}"><i data-lucide="${c.icon}" style="width:16px;"></i><span>${c.label}</span></button>`
    ).join('');

    return `
      <div class="rcf-right-page book-page-container">
        <div class="book-page-header" style="justify-content: space-between;">
          <h2 class="rcf-title"><i data-lucide="feather" style="width:18px;margin-right:6px;"></i>Новий рецепт</h2>
          <button class="rcf-close" id="rcf-close" type="button"><i data-lucide="x" style="width:18px;"></i></button>
        </div>

        <div class="book-page-scroll-spine-left">
          <div class="rcf-form">

            <!-- Photo upload area -->
            <div class="rcf-photo-area" id="rcf-photo-area">
              <i data-lucide="camera" style="width:32px;height:32px;opacity:0.4;"></i>
              <span class="rcf-photo-label">Додати фото</span>
              <span class="rcf-photo-hint">Буде доступно пізніше</span>
            </div>

            <input type="text" id="rcf-name" class="rcf-input rcf-input--title" placeholder="Назва рецепту">
            <input type="text" id="rcf-subtitle" class="rcf-input" placeholder="Короткий опис">

            <h3 class="rcf-section-title">Категорія</h3>
            <div class="rcf-cat-grid" id="rcf-cat-grid">${catBtns}</div>

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
                <i data-lucide="feather" style="width:16px;"></i> Створити рецепт
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

    // Category selection
    this.$$('.rcf-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.$$('.rcf-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCategory = btn.dataset.cat;
      });
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

  async _submit() {
    // Auth guard — only logged-in users can create recipes
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
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
      category: this.selectedCategory || '',
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
    btn.innerHTML = '<i data-lucide="loader" style="width:16px;animation:spin 1s linear infinite;"></i> Створення...';
    btn.disabled = true;
    if (window.lucide) lucide.createIcons({ root: btn });

    const result = await RecipeService.create(data);
    if (result && result.id) {
      console.log('✅ Recipe created:', result.id);
      this.onCreated(result);
    } else {
      alert('Помилка при створенні рецепту. Перевірте авторизацію.');
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons({ root: btn });
    }
  }
}
