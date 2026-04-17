# EatPan Frontend v2 — Новий Фронтенд + Розширення API (v1.1 — оновлено 06.04.2026)

## Контекст

Поточний фронтенд (`EatPan_Fr`) зростав органічно: секції, модулі, меню — все додавалось поступово, що привело до нерівномірного дизайну та хаотичної ієрархії файлів. Потрібен **чистий старт** — `EatPan_Fr_2` з правильною архітектурою, RPG-натхненним однорідним стилем та покращеною механікою.

**Підтверджую:** Так, бекенд — це звичайний Django REST API, який відповідає на fetch-запити. Можна мати **будь-яку кількість фронтендів**, кожен зі своїм UI, і всі вони працюватимуть з одним бекендом через `api.eatpan.com`.

---

## User Review Required

> [!IMPORTANT]
> **Назва директорії:** Використовую `EatPan_Fr_2` як вказано. Планую зберегти старий `EatPan_Fr` поки що — як референс.

> [!IMPORTANT]
> **Дизайн:** На основі скинутих зображень — RPG/Fantasy стиль (темний фон, орнаментовані бордери, текстура пергаменту, бронзові/золоті акценти). Чи це правильне розуміння?

> [!IMPORTANT]
> **Секції:** Наразі у EatPan_Fr існує 5 секцій: Hero, My Kitchen, Recipe Book, Craft Space, Timetable+Calendar. Які з них переносити у Fr_2? Ви сказали "поки не чіпаємо книгу рецептів та задачі", тому я планую зробити **заглушки** для цих секцій, а реалізувати механіку тільки для: Hero, My Kitchen.

---

## Proposed Changes

### ЧАСТИНА 1: Нова Файлова Структура Frontend v2

```
EatPan_Fr_2/
├── .agents/                            # ✅ Правила та скіли проєкту
│   ├── rules/
│   │   ├── project_rules.md            # ✅ Stack, Architecture, Conventions, DO NOT
│   │   └── language_rules.md           # ✅ Документація RU/UA
│   └── workflows/
│       └── create_component.md         # ✅ Skill: як створити новий компонент
│
├── index.html                          # ✅ SPA shell (header + main + footer)
├── main.js                             # ✅ Entry point: import AppShell + init() (18 рядків)
│
├── src/
│   ├── core/
│   │   ├── Component.js                # ✅ Базовий клас (template, onMount, onDestroy, $, $$, update, destroy)
│   │   ├── ~~Router.js~~               # ❌ ВИДАЛЕНО з плану — history API вбудований в SectorCarousel
│   │   └── ApiClient.js                # ✅ Fetch-обгортка: 6 сервісів (api.eatpan.com)
│   │
│   ├── styles/
│   │   ├── tokens.css                  # ✅ CSS variables: кольори, шрифти, embossed бордери
│   │   ├── layout.css                  # ✅ CSS Grid shell, sector cards, wedges, overlays
│   │   ├── themes.css                  # ✅ 9 тем (vintage, royal, bronze, silver, neon, tangerine, scroll, cyber)
│   │   └── responsive.css              # ✅ 17+ @media queries
│   │
│   ├── components/
│   │   ├── app_shell/                  # ✅ НОВИЙ — головний оркестратор (не було в оригінальному плані)
│   │   │   └── AppShell.js             # ✅ З'єднує carousel + menu + clock + user state
│   │   │
│   │   ├── sector_carousel/
│   │   │   └── SectorCarousel.js       # ✅ Карусель: infinite scroll, clones, wheel/touch/keyboard/click, wedges, history
│   │   │
│   │   ├── menu/
│   │   │   ├── MenuOverlay.js          # ✅ Overlay меню + theme picker (замінює Menu.js + StylePicker.js)
│   │   │   └── menu.css                # ✅ Стилі
│   │   │
│   │   ├── clock/
│   │   │   └── clock.css               # ✅ CSS ready (JS-логіка вбудована в AppShell)
│   │   │
│   │   ├── auth_panel/
│   │   │   ├── AuthPanel.js            # ⬜ TODO: Login/Register/Google OAuth
│   │   │   └── auth_panel.css          # ✅ CSS ready
│   │   │
│   │   ├── user_profile/
│   │   │   ├── UserProfile.js          # ⬜ TODO: Профіль як wedge-сектор
│   │   │   └── user_profile.css        # ✅ CSS ready
│   │   │
│   │   ├── ~~style_picker/~~           # ❌ ВБУДОВАНО в MenuOverlay (theme swatches grid)
│   │   │
│   │   └── settings_panel/             # ⬜ Планується (Фаза 4)
│   │       └── SettingsPanel.js
│   │
│   └── sectors/                        # Секції контенту (7 замість первинних 5)
│       ├── hero/                       # ⬜ TODO
│       ├── kitchen/                    # ⬜ TODO
│       ├── recipe_book/                # ⬜ TODO (портування з Fr_1)
│       ├── craft_space/                # ⬜ TODO
│       ├── taskboard/                  # ⬜ TODO (Eisenhower + Weekly)
│       ├── timeline/                   # ⬜ TODO (Calendar)
│       └── social/                     # ⬜ TODO (Community)
│
└── assets/                             # ⬜ Буде створено за потреби
    ├── fonts/
    └── textures/
```

### Архітектурні Рішення (прийняті під час реалізації)

> [!NOTE]
> **Router.js видалено з плану.** History API (`pushState`/`popstate`) вбудований безпосередньо в `SectorCarousel.js`, оскільки навігація в цьому додатку = перемикання секторів/wedges, що тісно зв'язане з каруселлю. Окремий роутер додав би непотрібну абстракцію.

> [!NOTE]
> **AppShell.js доданий.** Його не було в оригінальному плані, але він є ключовим елементом модульної архітектури. Замість монолітного `main.js`, AppShell оркеструє всі під-компоненти: SectorCarousel, MenuOverlay, clock, user state, back button logic.

> [!NOTE]
> **StylePicker.js вбудований в MenuOverlay.** Замість окремого компонента, theme swatches (9 тем) живуть у меню як grid кольорових кнопок — простіше і ергономічніше.

---

### ЧАСТИНА 2: Механіка Каруселі + Вклинення Модулів

Головний принцип поточного EatPan_Fr, який переноситься:

1. **Нескінченна карусель секторів** — клони останніх/перших блоків для безшовної прокрутки
2. **Активація сектора** — клік по секторі → він розгортається на повний екран → `body.active-mode`
3. **Годинник вклинюється** — натискаєш на маленький годинник → він "роздвигає" сектори і сам стає повноекранним
4. **Деактивація** — кнопка "назад" або Escape → повернення до карусселі

**Що ЗМІНЮЄТЬСЯ у Fr_2:**

- **Профіль** вклинюється так само як годинник (а не як overlay/drawer). Натискаєш на аватар → профіль анінімовано з'являється як сектор.
- **Auth панель** (login/register) — теж вклинюється, а не як overlay поверх усього.
- **Меню** при відкритті появляється **поверх** секторів (overlay), а не раздвигає їх. Всередні меню — ярлички (вибір стилю, налаштування, профіль).
- **Style Picker** — окрема панель з варіантами тем (кольорові карточки, клік → зміна `body.className`).

---

### ЧАСТИНА 3: Розширення API (Backend — нові endpoints)

Поточні API endpoints:
```
GET/POST         /api/v1/recipes/
GET/PUT/DELETE   /api/v1/recipes/{id}/
POST             /api/v1/recipes/{id}/toggle_like/
GET/POST         /api/v1/recipe-books/
GET/PUT/DELETE   /api/v1/recipe-books/{id}/
GET              /api/health
```

**Нові endpoints для Fr_2 (планується JSON-based, без нових Django моделей):**

#### Група 1: UserProfile
```
GET    /api/v1/profile/me/              # Повертає профіль поточного юзера (tasks, liked_recipes, preferences)
PUT    /api/v1/profile/me/              # Оновити профіль
GET    /api/v1/profile/me/stats/        # Статистика: кількість рецептів, лайків, задач
```

#### Група 2: Tasks (зберігаються в UserProfile.tasks JSON)
```
GET    /api/v1/tasks/                   # Всі задачі поточного юзера
POST   /api/v1/tasks/                   # Створити задачу
PUT    /api/v1/tasks/{uuid}/            # Оновити задачу
DELETE /api/v1/tasks/{uuid}/            # Видалити задачу
```

Задачі зберігаються в `UserProfile.tasks` (JSONField). Формат (на основі зображення Weekly Planner + Eisenhower Matrix):
```json
{
  "uuid": "...",
  "title": "Приготувати бульйон",
  "description": "Для рецепту борщу",
  "priority": "urgent_important",        // "urgent_important" | "urgent_less" | "less_urgent_important" | "less_urgent_less"
  "status": "pending",                   // "pending" | "in_progress" | "done"
  "due_date": "2026-04-10",
  "day_of_week": "monday",              // для тижневого планера
  "category": "cooking",
  "created_at": "2026-04-06T12:00:00Z"
}
```

#### Група 3: Preferences (зберігаються в UserProfile.tasks → або нове поле)
```
GET    /api/v1/preferences/             # Налаштування: тема, мова, звук тощо
PUT    /api/v1/preferences/             # Зберегти налаштування
```

Формат:
```json
{
  "theme": "bronze",
  "language": "uk",
  "sound_volume": 0.7,
  "music_volume": 0.5,
  "notifications_enabled": true
}
```

#### Група 4: Health / Admin (для майбутнього Control View)
```
GET    /api/v1/admin/nodes-status/      # Стан усіх нод
POST   /api/v1/admin/sync-catchup/      # Запуск sync_db
GET    /api/v1/admin/db-drift/          # Порівняння UUID-наборів
```

---

### ЧАСТИНА 4: Дизайн (RPG/Fantasy Style)

На основі наданих зображень:
- **Фон:** Темний (#1a1510), текстура дерева/шкіри
- **Карточки:** Пергаментні текстури з орнаментованими бордерами
- **Кнопки:** Бірюзові/мідні металізовані градієнти з декоративними кутами
- **Заголовки:** Serif шрифт (EB Garamond / Noto Serif), золотисто-бронзовий колір
- **Іконки:** Металізовані, з subtle glow
- **Прогрес-бари:** RPG-стиль (здоров'я/стаміна) — для задач та рівня юзера
- **Бордери секторів:** Орнаментовані (#3a2d1c тінь + #8b6914 золотистий accent)

Ці стилі вже відповідають деяким існуючим темам (`theme-bronze`, `theme-scroll` з `themes.css`).

---

### ЧАСТИНА 5: Responsive (Media Queries)

**Меню ВНИЗУ** (≤ 1023px):
```
@media (min-width: 320px) and (max-width: 479px) and (orientation: portrait)
@media (min-width: 320px) and (max-width: 479px) and (orientation: landscape)
@media (min-width: 480px) and (max-width: 767px) and (orientation: portrait)
@media (min-width: 480px) and (max-width: 767px) and (orientation: landscape)
@media (min-width: 768px) and (max-width: 1023px) and (orientation: portrait)
@media (min-width: 768px) and (max-width: 1023px) and (orientation: landscape)
```

**Меню ЗВЕРХУ** (≥ 1024px):
```
@media (min-width: 1024px) and (max-width: 1199px) and (orientation: portrait)
@media (min-width: 1024px) and (max-width: 1199px) and (orientation: landscape)
@media (min-width: 1200px) and (max-width: 1439px)
@media (min-width: 1440px) and (max-width: 1919px)
@media (min-width: 1024px) and (max-width: 1199px) and (max-height: 750px) and (orientation: landscape)
@media (min-width: 1200px) and (max-width: 1439px) and (max-height: 750px)
@media (min-width: 1440px) and (max-width: 1919px) and (max-height: 850px)
@media (min-width: 1920px) and (max-height: 950px)
@media (min-width: 1920px)
```

---

## Порядок Виконання (Фази) — з позначками статусу

### Фаза 1: Каркас + Карусель ✅ ЗАВЕРШЕНО
1. ✅ Створити структуру директорій `EatPan_Fr_2/`
2. ✅ Створити `tokens.css` (дизайн-токени RPG стилю)
3. ✅ Створити `layout.css` (CSS Grid shell, sector cards)
4. ✅ Створити `responsive.css` (17+ media queries)
5. ✅ Створити `SectorCarousel.js` — нескінченна прокрутка секторів
6. ✅ Створити `index.html` + `main.js` — точка входу
7. ✅ Секторні заглушки (Hero, Kitchen, RecipeBook, CraftSpace, Taskboard, Timeline, Social) — **7 замість 5**
8. ⬜ **Запустити локально, перевірити карусель працює** — потребує Live Server

### Фаза 1.5: Рефакторинг ✅ ЗАВЕРШЕНО (додана після юзер-фідбеку)
1. ✅ Розбити монолітний `main.js` → `AppShell.js` + `SectorCarousel.js` + `MenuOverlay.js`
2. ✅ Створити `.agents/` з правилами та скілами проєкту
3. ✅ Замінити emoji на Lucide іконки
4. ✅ CSS Grid як обов'язкове правило для всіх layout'ів
5. ✅ Header завжди видимий, Footer тільки Back + Menu FABs на mobile

### Фаза 2: Меню + Годинник + Стилі ✅ ЗАВЕРШЕНО
1. ✅ `MenuOverlay.js` — overlay поверх секторів + theme picker
2. ✅ Clock — годинник в header + wedge block (CSS ready, JS в AppShell)
3. ✅ ~~StylePicker.js~~ — вбудовано в MenuOverlay
4. ✅ `themes.css` — 9 тем (vintage, royal, bronze, silver, neon, tangerine, scroll, cyber)

### Фаза 3: Auth + Профіль як Сектори ⬜ НАСТУПНИЙ
1. ⬜ `AuthPanel.js` — login/register/Google OAuth, wedge-контент
2. ⬜ `UserProfile.js` — профіль wedge (аватар, email, stats, logout)
3. ⬜ Backend: нові endpoints (`/profile/me/`, `/tasks/`, `/preferences/`)

### Фаза 4: Tasks + Preferences ⬜ ЗАПЛАНОВАНО
1. ⬜ Backend: JSON-based tasks CRUD
2. ⬜ Frontend: Task Manager у секторі (Eisenhower matrix UI)
3. ⬜ `SettingsPanel.js` — налаштування (звук, мова)

---

## Open Questions

> [!NOTE]
> **Питання 1-3 — відповіді отримано:**
> 1. ✅ Стиль підтверджено: RPG/Fantasy (темний, бронза, орнамент)
> 2. ✅ 7 секторів з заглушками. Всі починаються як заглушки, наповнюються поетапно.
> 3. ⬜ Tasks: формат Eisenhower + Weekly — буде в окремому секторі `Taskboard`

> [!IMPORTANT]
> **Нові відкриті питання:**
> 1. Чи потрібні `.html` файли-шаблони для компонентів, чи достатньо `template()` методу в JS?
> 2. Пріоритет: спершу Auth/Profile (E.3) чи контент секторів (E.4)?
> 3. Чи робити Control View (Етап C) паралельно з Fr_2?

---

## Verification Plan

### Automated Tests
- Відкрити `EatPan_Fr_2/index.html` в браузері → карусель працює
- Перевірити responsive: меню внизу на <1024px, зверху на ≥1024px
- Натиснути на годинник → він розкривається як сектор
- Натиснути на профіль → він вклинюється як сектор
- API fetch: `fetch('https://api.eatpan.com/api/v1/recipes/')` → відповідь 200

### Manual Verification
- Порівняти дизайн з референсними зображеннями
- Перевірити на реальних мобільних пристроях
