# EatPan — Project Rules

## Stack
- **Vanilla JS (ES Modules)** — без фреймворков, без бандлеров
- **CSS**: BEM + CSS Variables, без Tailwind
- **Icons**: Lucide (CDN: `https://unpkg.com/lucide@latest`)
- **Fonts**: Google Fonts (Noto Serif, Work Sans, EB Garamond, Crimson Pro)
- **Backend (future)**: Django REST API — `src/api/RecipeService.js`

## Architecture
```
index.html   ← SPA shell (только скелет, без логики)
main.js      ← SPA router + все глобальные JS (DOMContentLoaded)
src/
  core/      ← Component.js (base class), EventBus.js
  api/       ← RecipeService.js (Django API layer)
  modules/   ← изолированные модули (recipe-book, ...)
  styles/    ← global.css only
```

## Key Conventions
- Все компоненты наследуются от `Component` (`src/core/Component.js`)
- `render()` — async, возвращает DOM-элемент
- Глобальные JS-функции (вызываемые из inline HTML onclick) — **обязательно** регистрировать как `window.functionName`
- CSS-переменные определены в `global.css → :root`
- Никаких inline `<style>` блоков — всё в CSS-файлах

## CSS Variables (Design Tokens)
```css
--parchment: #f1eacc;   --ink: #2c1810;
--accent: #805533;       --brand-red: #6b0d12;
--tab-bg: #dcc99e;       --book-bg: #2c1810;
--font-serif: 'EB Garamond', serif;
--font-title: 'Noto Serif', serif;
--font-body: 'Work Sans', sans-serif;
```

## Module: recipe-book
- Entry: `BookModule.js` → `Book.js` → `PageLeft.js` + `PageRight.js`
- Монтируется в `#cookbook-section` (section_block data-index="2")
- Стили: `book.css`, `ribbons.css`, `media.css`

## Adaptivity (6 states)
Media breakpoints defined in `media.css`:
320-480px portrait/landscape → 481-700 → 701-900 → 901-1200 → 1201-1400 → 1401+

## DO NOT
- Не трогать логику infinite-scroll и clock animation без necessity
- Не добавлять `<script>` блоки в `index.html`
- Не ломать `grid-template-rows: auto auto 1fr auto` на `.page--left`
