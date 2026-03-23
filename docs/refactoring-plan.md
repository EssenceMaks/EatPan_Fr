# Рекомендації з рефакторингу EatPan SPA

## 1. Розбиття `main.js` (516 рядків)

### Коли розбивати

| Сигнал | Поточний стан | Поріг для дії |
|--------|--------------|---------------|
| Кількість рядків | ~516 | > 600 — починай виділяти модулі |
| Кількість `window.*` функцій | ~15 | > 20 — виносити в окремий файл |
| Нові секції (Supply, Timetable) | placeholder | Кожна нова секція = новий модуль |

### Як розбивати

Рекомендований план поетапного виділення:

```
main.js  (~100 рядків — тільки ініціалізація та імпорти)
├── src/core/ScrollEngine.js      — infinite scroll, snap, touch events
├── src/core/ClockManager.js      — малий годинник, великий годинник, анімація
├── src/core/SectionRouter.js     — activateBlock, goBack, history API
├── src/core/GlobalHandlers.js    — window.* функції (toggleEdit, toggleCreateRecipe, etc.)
└── src/modules/*/                — кожен модуль ініціалізує свій блок
```

**Порядок виділення (від найбезпечнішого):**

1. **`ClockManager.js`** — повністю ізольована логіка, 0 залежностей від інших частин. ~80 рядків. Найпростіший перший крок.
2. **`GlobalHandlers.js`** — всі `window.*` функції в один файл. Легко виділити, бо це плоский список функцій.
3. **`ScrollEngine.js`** — scroll/touch логіка. Складніше, бо взаємодіє з `activateBlock` та `history`.
4. **`SectionRouter.js`** — активація блоків, history API. Виділяти останнім, бо це "клей" між компонентами.

**Патерн для виділення:**

```js
// src/core/ClockManager.js
export function initClock(smallClockEl, bigClockFaceEl, bigClockHandEl, bigTimeDisplayEl) {
    // ... вся логіка годинника
}

// main.js
import { initClock } from './src/core/ClockManager.js';
// ...
document.addEventListener('DOMContentLoaded', () => {
    initClock(smallClock, bigClockFace, bigClockHand, bigTimeDisplay);
});
```

### Правила під час розбиття

- **Не ламай inline onclick** — `window.*` функції мають залишатися глобальними
- **Один імпорт = один модуль** — не створюй циклічних залежностей
- **Тестуй після кожного виділення** — hard refresh + перевірити всі секції

---

## 2. Розбиття `global.css` (423 рядки)

### Коли розбивати

Зараз `global.css` містить:
- Design tokens (`:root` змінні) — ~30 рядків
- Reset/base стилі — ~20 рядків
- Layout (layer, grid, header/footer) — ~60 рядків
- Section blocks — ~80 рядків
- Clock — ~70 рядків
- Modal — ~20 рядків
- Active modes — ~30 рядків
- Typography — ~15 рядків

**Поріг:** > 500 рядків або коли з'являться нові модулі зі своїми глобальними стилями.

### Рекомендований план

```
src/styles/
├── tokens.css        — :root змінні (кольори, шрифти, transitions, shadows)
├── reset.css         — *, body, html базові стилі
├── layout.css        — .layer, grid, header, footer, sectionBlocks
├── sections.css      — .section_block, active modes, inner-content
├── clock.css         — clock-container, bigClock, анімації
├── modal.css         — modal-overlay, modal-content
└── typography.css    — шрифтові маппінги, .text-h1, .section-title
```

**Порядок в `<head>`:**
```html
<link rel="stylesheet" href="./src/styles/tokens.css">
<link rel="stylesheet" href="./src/styles/reset.css">
<link rel="stylesheet" href="./src/styles/layout.css">
<link rel="stylesheet" href="./src/styles/sections.css">
<link rel="stylesheet" href="./src/styles/clock.css">
<link rel="stylesheet" href="./src/styles/modal.css">
<link rel="stylesheet" href="./src/styles/typography.css">
<!-- module styles -->
```

**Але:** поки `global.css` < 500 рядків і є єдиним глобальним файлом — **не варто розбивати передчасно**. Це додасть HTTP-запитів без реальної вигоди. Розбивай коли з'явиться конкретна потреба (наприклад, нові модулі конфліктують зі стилями).

---

## 3. Інші файли для рефакторингу

### `index.html`

- **Стара модалка** (`#edit-modal`) — видалити коли `toggleCreateRecipe` повністю замінить `toggleEdit`
- **Inline styles** — на `#cookbook-section` та деяких елементах є inline style. Винести в CSS
- **Section blocks** — коли з'являться нові модулі, виносити шаблони секцій в окремі HTML partials (або генерувати з JS)

### `RecipeService.js`

- Зараз mock. При підключенні Django API:
  - Додати error handling (try/catch з user-friendly повідомленнями)
  - Додати loading state
  - Кешування відповідей
  - Retry логіка для нестабільного з'єднання

### Component.js

- Додати `destroy()` метод для cleanup (event listeners, timers)
- Розглянути додавання простого state management (`this.state`, `setState()` → auto re-render)

---

## 4. Загальні правила чистоти коду

### Конвенції

- **Один файл = одна відповідальність** (SRP)
- **Компоненти < 150 рядків** — якщо більше, виділяй підкомпоненти
- **CSS файли < 400 рядків** — якщо більше, розбивай по логічних блоках
- **Не дублюй стилі** — використовуй CSS змінні та спільні класи

### Naming

- JS файли: `PascalCase` для компонентів (`BookModule.js`), `camelCase` для утиліт (`clockManager.js`)
- CSS класи: BEM (`block__element--modifier`)
- CSS файли: `kebab-case` (`create-recipe.css`)
- Папки: `kebab-case` (`recipe-book`)

### Перед кожним комітом

1. Перевірити що немає `console.log` в продакшн коді (крім `console.error`)
2. Перевірити що всі `window.*` задокументовані в `GlobalHandlers` або в коментарі
3. Hard refresh + перевірити всі секції вручну
4. Оновити CHANGELOG.md

### Code smells — сигнали до рефакторингу

| Smell | Приклад | Дія |
|-------|---------|-----|
| Файл > 300 рядків | `main.js` | Виділити модулі |
| Дублювання коду | Однакові стилі в різних CSS | Винести в спільний клас |
| God object | `main.js` знає про все | Розділити за відповідальністю |
| Magic numbers | `min-height: 850px` | Винести в CSS змінну |
| Unused code | `Ribbon.js`, стара модалка | Видалити або позначити TODO |

---

## 5. Пріоритетність

| # | Що | Коли | Зусилля |
|---|-----|------|---------|
| 1 | Видалити стару модалку з index.html | Після підтвердження що create mode працює | 5 хв |
| 2 | Виділити `ClockManager.js` з main.js | Наступний рефакторинг-сесія | 30 хв |
| 3 | Виділити `GlobalHandlers.js` з main.js | Коли window.* > 20 функцій | 20 хв |
| 4 | Inline styles → CSS | Перед code review | 15 хв |
| 5 | Розбити global.css | Коли > 500 рядків або новий модуль | 45 хв |
| 6 | Виділити ScrollEngine + SectionRouter | Коли додаються нові секції | 1-2 год |
