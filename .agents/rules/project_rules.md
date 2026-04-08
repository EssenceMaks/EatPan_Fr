---
description: Core architecture and coding rules for EatPan Frontend v2
---

# EatPan Frontend v2 — Project Rules

## Stack
- **Vanilla JS (ES Modules)** — без фреймворків, без бандлерів
- **CSS**: CSS Variables + CSS Grid, без Tailwind
- **Icons**: Lucide (CDN: `https://unpkg.com/lucide@latest`) — НІЯКИХ emoji в UI
- **Fonts**: Google Fonts (EB Garamond, Work Sans, Cinzel, Noto Serif)
- **Backend**: Django REST API через `src/core/ApiClient.js` → `https://api.eatpan.com/api/v1`

## Architecture
```
EatPan_Fr_2/
├── index.html              ← SPA shell (тільки скелет, без логіки)
├── main.js                 ← Точка входу: імпортує AppShell, запускає init()
├── src/
│   ├── core/
│   │   ├── Component.js    ← Базовий клас для всіх компонентів
│   │   └── ApiClient.js    ← Fetch-обгортка: RecipeService, BookService, etc.
│   │
│   ├── components/         ← Ізольовані компоненти (кожен = папка з .js + .html + .css)
│   │   ├── app_shell/      ← AppShell.js — головний інтерфейс (карусель, header/footer)
│   │   ├── sector_carousel/← SectorCarousel.js — нескінченна прокрутка секторів
│   │   ├── menu/           ← MenuOverlay.js — overlay меню, theme picker
│   │   ├── clock/          ← Clock.js — годинник (wedge в карусель)
│   │   ├── auth_panel/     ← AuthPanel.js — login/register/OAuth
│   │   ├── user_profile/   ← UserProfile.js — профіль юзера (wedge)
│   │   └── style_picker/   ← StylePicker.js — вибір теми
│   │
│   ├── sectors/            ← Секції контенту (заглушки → потім наповнення)
│   │   ├── hero/           ← HeroSector.js
│   │   ├── kitchen/        ← KitchenSector.js
│   │   └── ...
│   │
│   └── styles/
│       ├── tokens.css      ← CSS Variables (design tokens)
│       ├── layout.css      ← Grid shell, sector cards, layers
│       ├── themes.css      ← Теми (vintage, royal, bronze...)
│       └── responsive.css  ← Media queries (17+)
```

## Key Conventions

### Компонентний підхід (Vanilla Component System)
- Усі компоненти наслідуються від `Component` (`src/core/Component.js`)
- `template()` — async, повертає HTML-рядок
- `onMount()` — lifecycle hook після вставки в DOM
- `onDestroy()` — cleanup
- `render(target, mode)` — монтує компонент у DOM
- `this.$()` / `this.$$()` — query within component scope

### CSS Grid — обов'язково
- **Усі розкладки** компонентів будуються на CSS Grid (`display: grid`)
- **Виняток**: механіка каруселі (горизонтальна прокрутка) використовує `display: flex`
- Контент всередині секторів, панелей, форм — завжди на Grid

### Lucide Icons — обов'язково
- Іконки тільки через Lucide: `<i data-lucide="icon-name"></i>`
- Після динамічної вставки HTML — обов'язково `lucide.createIcons()`
- **НІКОЛИ** не використовувати emoji як іконки в UI

### Модульність
- `main.js` — ТІЛЬКИ точка входу (import + init)
- Вся логіка — у компонентах (`src/components/`)
- Глобальні функції (для inline HTML) — `window.functionName` у відповідному компоненті
- Кожен компонент: `.js` (логіка) + `.html` (шаблон, опціонально) + `.css` (стилі)

### CSS Variables та Theming
- Дизайн-токени в `tokens.css → :root`
- Кожна тема перевизначає семантичні аліаси: `--bg-app`, `--text-accent`, etc.
- Переключення теми: `body.className = 'theme-{name}'` + `localStorage`

## DO NOT
- НЕ створювати монолітних файлів — розбивати на компоненти
- НЕ використовувати emoji як іконки в інтерфесі
- НЕ вставляти inline `<style>` блоки
- НЕ ламати механіку infinite-scroll та clock animation
- НЕ використовувати `<script>` блоки в `index.html` (тільки один `<script type="module">`)
- НЕ видаляти keyboard navigation (стрілки, Escape, Enter)
- НЕ видаляти history popstate обробку (back/forward)
- НЕ видаляти wheel та touch обробку каруселі

## Backend API
- Endpoint: `https://api.eatpan.com/api/v1` (через Cloudflare Worker)
- Local dev: `http://localhost:6600/api/v1`
- Auth: `Authorization: Bearer {access_token}` з localStorage
- Формат: JSON, Django REST Framework ViewSets
