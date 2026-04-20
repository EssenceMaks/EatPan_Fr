# EatPan Frontend (EatPan_Fr) 🍳📜

Клієнтська частина екосистеми **EatPan** — Single Page Application (SPA), створене на чистому **Vanilla JavaScript** без фреймворків.
Проєкт виконано в унікальному RPG-стилі «Parchment & Ink» (пергамент та чорнило), перетворюючи рутинні завдання — планування їжі, купівлю продуктів, побутові справи — на захопливий квест.

---

## 🏗 Архітектура та стек технологій

| Компонент | Технологія |
|---|---|
| **Мова** | Vanilla JS (ES6+ Modules) — нативний JavaScript без збирачів |
| **Компоненти** | Самописний `Component.js` — базовий клас із реактивним рендерингом (`onMount`, `onDestroy`, `template`, `_render`) |
| **Маршрутизація** | Вбудований `Router.js` — History API, SPA-навігація без перезавантаження |
| **API-клієнт** | `ApiClient.js` — Circuit Breaker із автопереключенням між бекендами |
| **Стилізація** | Vanilla CSS + система дизайн-токенів (`themes.css`, `tokens.css`) — підтримка тем: Light, Dark, Sepia |
| **UI Kit** | Бібліотека самописних RPG-компонентів (`src/components/ui_kit/`) |
| **Іконки** | [Lucide Icons](https://lucide.dev/) |
| **Авторизація** | Supabase GoTrue + Google OAuth |

---

## 🗺 Основні модулі

| Модуль | Опис |
|---|---|
| 📖 **Recipe Book** (Книга рецептів) | Візуалізація у вигляді розвороту старої книги. Категорії, закладки (Prepared / Planned), lightweight-формат завантаження з API |
| 📜 **Task Board** (Дошка квестів) | RPG-дошка завдань: матриця Ейзенхауера, Timeline (хронологія), Calendar, QuestList із налаштуваннями |
| 📅 **Meal Planner** (Планувальник) | Візуальний планувальник розкладу їжі на тиждень за прийомами їжі (сніданок, обід, вечеря) |
| 📦 **Pantry** (Кладова) | Інвентар продуктів та готових страв із відстеженням термінів придатності |
| 🛒 **Shopping Lists** (Списки покупок) | Синхронізовані з Планувальником списки, що оновлюються через event-driven архітектуру |
| 👥 **Social Sector** | Профіль, друзі, підписки — соціальний шар екосистеми |

---

## 📂 Структура проєкту

```text
EatPan_Fr/
├── src/
│   ├── core/                   # Ядро SPA
│   │   ├── ApiClient.js        # Мережевий клієнт із Circuit Breaker та Failover
│   │   ├── Component.js        # Базовий клас для всіх UI-компонентів
│   │   ├── Router.js           # SPA-маршрутизатор (History API)
│   │   ├── supabaseClient.js   # Ініціалізація Supabase SDK
│   │   ├── mediaResolver.js    # Резолвер медіа-ресурсів (UUID → URL)
│   │   ├── config.js           # Конфігурація (Supabase URL, ключі)
│   │   └── config.example.js   # Шаблон конфігурації
│   ├── components/             # UI-компоненти та модулі
│   │   ├── app_shell/          # AppShell — кореневий layout
│   │   ├── recipe_book/        # Книга рецептів (Left/Right pages, CreateForm)
│   │   ├── recipe/             # Окремий рецепт (Overview, Instructions)
│   │   ├── taskboard/          # Дошка квестів (Eisenhower, QuestList, TimeList, Calendar)
│   │   ├── meal_plan_stub/     # Планувальник їжі
│   │   ├── pantry_stub/        # Кладова
│   │   ├── shopping_stub/      # Списки покупок + Експорт
│   │   ├── social_sector/      # Соціальний модуль
│   │   ├── auth_panel/         # Панель авторизації
│   │   ├── menu/               # Головне RPG-меню
│   │   ├── ui_kit/             # Бібліотека RPG UI-компонентів
│   │   │   ├── glyph_button/   # Кнопки-гліфи
│   │   │   ├── sigil_diamond/  # Діамантові сігіли
│   │   │   ├── rune_title/     # Рунічні заголовки
│   │   │   ├── arc_lightbox/   # Лайтбокс
│   │   │   ├── gear_input/     # Інпути, дропдауни, слайдери
│   │   │   └── ...             # 20+ компонентів
│   │   └── ...
│   ├── modules/                # Бізнес-логіка (сервіси)
│   └── styles/                 # Глобальні стилі
│       ├── themes.css          # Дизайн-токени для тем (Light, Dark, Sepia)
│       ├── tokens.css          # CSS-змінні кольорів, шрифтів, розмірів
│       ├── layout.css          # Глобальний layout
│       └── responsive.css      # Адаптивність
├── referens/                   # HTML/CSS прототипи та дизайн-референси
├── .agents/                    # Промпти та правила для AI-агентів
├── docs/                       # Планування та документація фічерів
├── index.html                  # Єдина точка входу (Entry Point)
├── main.js                     # Ініціалізація додатку
├── ui_kit.html                 # Інтерактивний каталог UI Kit
├── CNAME                       # Домен для GitHub Pages / Cloudflare Pages
├── API_ENDPOINTS.md            # Документація API ендпоінтів бекенду
└── .gitignore
```

---

## 🚀 Як запустити проєкт

Оскільки це чистий Vanilla JS без Webpack/Vite, запуск максимально простий:

### 1. Локальна розробка

```bash
# 1. Клонувати репозиторій
git clone <repo-url> && cd EatPan_Fr

# 2. Запустити статичний HTTP-сервер (Python)
python -m http.server 6800

# Або використати Live Server у VS Code
```

👉 Відкрити в браузері: [http://localhost:6800](http://localhost:6800)

### 2. Підключення до бекенду (API Routing)

`ApiClient.js` автоматично підключається до бекендів у порядку пріоритету:

| Пріоритет | Бекенд | URL |
|---|---|---|
| 1 | Локальний Django API | `http://localhost:6600/api/v1` |
| 2 | Cloudflare Worker API | `https://api.eatpan.com/api/v1` |
| 3 | Render Fallback API | `https://eatpan-back.onrender.com/api/v1` |

> **Важливо:** Якщо ви розробляєте бекенд локально, переконайтеся що `EatPan_Back` запущено на порту `6600`. Якщо локальний сервер недоступний — фронтенд непомітно перемкнеться на хмарний API.

---

## 🌐 Деплой (Production)

Проєкт є статичним сайтом і розгортається на будь-якому хостингу (Cloudflare Pages, GitHub Pages, Vercel, Netlify, Nginx).

**Головне правило:** Оскільки це SPA, сервер має перенаправляти всі `404 Not Found` запити назад на `index.html`, щоб вбудований JS-роутер коректно обробляв прямі посилання (`eatpan.com/recipe/123`).

---

## 🎨 UI Kit

Проєкт містить власну бібліотеку RPG-стилізованих UI-компонентів у `src/components/ui_kit/`. Інтерактивний каталог доступний через `ui_kit.html`:

```bash
# Відкрити каталог UI Kit
python -m http.server 6800
# Перейти на http://localhost:6800/ui_kit.html
```

Основні компоненти: `GlyphButton`, `GlyphNav`, `GlyphCombo`, `SigilDiamond`, `SigilShield`, `RuneTitle`, `GearInput`, `GearDropdown`, `GearSlider`, `ArcLightbox`, `SparkRibbon`, `FluxProgressBar`, `FluxStatBar`, `EdgeDivider`, `EdgeGaltel`, `SideTabRibbon`.

---

## 🛠 Правила розробки

### Керування станом
Стан зберігається локально всередині екземплярів `Component`. Для крос-компонентної синхронізації використовуються глобальні події:

```javascript
// Відправлення події:
window.dispatchEvent(new CustomEvent('shopping-list-updated'));
// Прослуховування:
window.addEventListener('shopping-list-updated', this._onUpdate);
```

### Робота з DOM
Компоненти повністю перерендерюють HTML при виклику `this._render()`. Прив'язка подій має використовувати **делегування** (event delegation):

```javascript
this.element.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="save"]');
  if (btn) this.saveData();
});
```

### CSS та стилізація
Уникайте inline-стилів. Використовуйте класи та CSS-змінні з `themes.css`:

```css
color: var(--c-ink-primary);
background: var(--c-bg-surface);
```

Підтримувані теми: **Light**, **Dark**, **Sepia**.

---

*Приємної розробки та смачних квестів!* ⚔️🍲
