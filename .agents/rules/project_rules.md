# EatPan — Project Rules

## Stack
- **Vanilla JS (ES Modules)** — без фреймворков, без бандлеров
- **CSS**: BEM + CSS Variables, без Tailwind
- **Icons**: Lucide (CDN: `https://unpkg.com/lucide@latest`)
- **Fonts**: Google Fonts (Noto Serif, Work Sans, EB Garamond, Crimson Pro)
- **Backend (future)**: Django REST API — `src/api/RecipeService.js`

## Architecture
```
index.html   ← SPA shell (только базовая разметка #app-root)
main.js      ← Инициализация приложения, монтирование AppShell
src/
  core/        ← Базовые классы (Component.js) и утилиты (ApiClient.js)
  components/  ← Переиспользуемые UI компоненты. Каждый в своей папке со своим `.js` и `.css`. (напр. app_shell, menu, user_profile)
  modules/     ← Бизнес-фичи (напр. clock, main_menu)
  styles/      ← Глобальные токены и стили (tokens.css, themes.css, layout.css)
```

## Key Conventions
- Все UI элементы наследуются от `Component` (`src/core/Component.js`).
- `render()` — возвращает DOM-элемент или строку разметки.
- Каждый компонент инкапсулирует свои стили в одноименном `.css` внутри папки компонента.
- Глобальные CSS переменные (токены дизайна) лежат в `src/styles/tokens.css` и `themes.css`.
- Никаких inline `<style>` блоков.

## CSS Variables (Design Tokens)
```css
--parchment: #f1eacc;   --ink: #2c1810;
--accent: #805533;       --brand-red: #6b0d12;
--tab-bg: #dcc99e;       --book-bg: #2c1810;
--font-serif: 'EB Garamond', serif;
--font-title: 'Noto Serif', serif;
--font-body: 'Work Sans', sans-serif;
```

## Adaptivity
Все медиа-запросы заложены в `src/styles/responsive.css`. 
Используйте строго эти брейкпоинты для консистентности UI:

**Меню снизу (Mobile/Tablet)**
- `@media (max-width: 479px) and (orientation: portrait)`
- `@media (max-width: 479px) and (orientation: landscape)`
- `@media (min-width: 480px) and (max-width: 767px) and (orientation: portrait)`
- `@media (min-width: 480px) and (max-width: 767px) and (orientation: landscape)`
- `@media (min-width: 768px) and (max-width: 1023px) and (orientation: portrait)`
- `@media (min-width: 768px) and (max-width: 1023px) and (orientation: landscape)`

**Меню сверху (Desktop / Large Screens)**
- `@media (min-width: 1024px) and (max-width: 1199px) and (orientation: portrait)`
- `@media (min-width: 1024px) and (max-width: 1199px) and (orientation: landscape)`
- `@media (min-width: 1200px) and (max-width: 1439px)`
- `@media (min-width: 1440px) and (max-width: 1919px)`
- `@media (min-width: 1920px)`
*(Для очень узких по высоте экранов также есть правила с `max-height` внутри `responsive.css`)*

## DO NOT
- Не добавлять `<script>` модули напрямую в `index.html`.
- Не нарушать изоляцию: каждый UI-компонент должен сам управлять своим состоянием.
- Не использовать inline-стили (все через CSS-переменные и классы).

## Figma Integration
- **Обязательно:** Перед внесением изменений в UI или добавлением новых модулей, сверяйтесь с макетом Figma через MCP сервер (см. `sync_with_figma.md`).
- **Файл Figma:** `lWzzBp0TFIsbeypUlRMSxu`

## API Endpoints Synchronization
- **Обязательно:** Любые изменения API (добавление, удаление, изменение параметров) должны сопровождаться обновлением файла `API_ENDPOINTS.md`.
- Файл `API_ENDPOINTS.md` должен быть всегда консистентным во всех проектах: `EatPan_Production`, `EatPan_Fr`, `EatPan_Back`, `EatPan_Supabase`.
- При обновлении `API_ENDPOINTS.md` копируйте его во все эти репозитории.
