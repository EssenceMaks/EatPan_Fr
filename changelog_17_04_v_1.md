# Changelog — 17.04.2026 (v1)

> Сессия разработки: 17.04.2026, ветка `update_recipe_gallery`  
> Мерж стилевых правок из `quick-style-fixes-recipe-book`

---

## 🔧 Баг-фиксы

### 1. Фотографии удалялись при добавлении новых (Edit-режим)

**Проблема:** При редактировании рецепта, который имел 3 существующие фотографии, добавление нового фото уничтожало все 3 — оставалось только новое.

**Корневая причина:** `_renderPhotoGrid()` в `RecipeCreateForm.js` делал `grid.innerHTML = ''`, что уничтожало DOM-элементы существующих фотографий (`.rcf-photo-existing`), а затем рендерил заново только `this.selectedFiles` (новые File-объекты).

**Исправление:** Заменено на `grid.querySelectorAll('.rcf-photo-tile:not(.rcf-photo-existing)').forEach(el => el.remove())` — удаляются только тайлы новых файлов, существующие фотографии не трогаются.

**Файл:** `src/components/recipe_book/RecipeCreateForm.js` (строки 368-399)

---

### 2. Категории не сохранялись / рецепт пропадал при смене категории

**Проблема:** При изменении категории рецепта (например, из "М'ясо" в "Риба") рецепт исчезал из обеих категорий. Также при создании рецепта с несколькими категориями он не появлялся ни в одной из них без перезагрузки.

**Корневые причины (3 взаимосвязанные):**

1. **Конструктор формы** (`RecipeCreateForm.js`, строка 20): при чтении legacy-строки `category: "Seafood, 15"` оборачивал её как одну категорию `["Seafood, 15"]` вместо разделения: `["Seafood", "15"]`.

2. **Левая страница** (`RecipeBookLeftPage.js`): методы `_getCategoriesData`, `_getListHierarchy` и grid-фильтр читали только `r.data.category` (строку) с точным совпадением, полностью игнорируя массив `r.data.categories`.

3. **Side ribbons** (`RecipeBook.js`, строка 200-208): извлечение категорий из рецептов тоже использовало только legacy `data.category` строку.

**Исправления:**
- Конструктор: `this.recipeData.category.split(',').map(s => s.trim()).filter(Boolean)`
- `_getCategoriesData`: проверяет `categories[]` массив → фоллбэк на `category` строку с разбивкой по `,`
- `_getListHierarchy`: то же самое + helper `getRecipeCats()`
- Grid-фильтр (`onMount`, строка ~262): проверяет оба формата
- `RecipeBook._loadRecipes`: то же для side ribbons

**Файлы:** 
- `src/components/recipe_book/RecipeCreateForm.js`
- `src/components/recipe_book/left_page/RecipeBookLeftPage.js`
- `src/components/recipe_book/RecipeBook.js`

---

### 3. Левая панель не обновлялась после сохранения рецепта

**Проблема:** После создания/обновления рецепта (особенно при смене категории) левая панель не перерисовывалась — рецепт не появлялся в новой категории. Требовался хард-рефреш.

**Корневая причина:** `RecipeBookRightPage.showEditForm` диспатчил событие `'recipe-updated'`, но **никто его не слушал** в `RecipeBook.js`.

**Исправление:** `RecipeBook.onMount` теперь подписывается на `window.addEventListener('recipe-updated', ...)` и вызывает `_loadRecipes()` — полная перезагрузка списка рецептов с API и обновление левой панели + side ribbons.

**Файл:** `src/components/recipe_book/RecipeBook.js` (строки 116-121, 188-190)

---

### 4. ArcLightbox (галерея) — prev/next крашили компонент

**Проблема:** При листании фотографий в галерее (ArcLightbox) стрелки prev/next вызывали ошибку `[Component] No target to render into`.

**Корневая причина:** методы `prev()` и `next()` вызывали `this.render()` без аргументов, а базовый `Component.render(target)` требует DOM-элемент контейнера.

**Исправление:** Заменено на `this.update()`, который находит родительский элемент автоматически.

**Файл:** `src/components/ui_kit/arc_lightbox/ArcLightbox.js` (строки 116-124)

---

### 5. Категории в Edit-форме — дизайн "чипсов"

**Проблема:** Категории в форме редактирования отображались как текст без рамок и фона вместо "чипсов" с цветным фоном.

**Корневая причина:** Разметка была заменена на `arc-glyph-runic-single`, что сломало CSS `.rcf-cat-btn`.

**Исправление:** Вернул разметку на `rcf-cat-btn` с сохранением кнопок Edit (✏️) и Delete (🗑).

**Файл:** `src/components/recipe_book/RecipeCreateForm.js` (строки 520-531)

---

## 🔀 Мерж ветки `quick-style-fixes-recipe-book`

Включённые изменения:
- **Размеры текстов:** уменьшен заголовок "КАТЕГОРІЇ" с 1.25rem → 1.15rem
- **Шаги рецепта открыты по умолчанию:** accordion `recipe-instructions-mount` рендерится как `expanded` сразу
- **Tooltip для ribbons:** добавлена подсказка при наведении на side ribbons
- **onCategorySelected callback:** при клике по категории на левой странице — ribbon на правой стороне подсвечивается соответственно
- **updateActiveCategory метод** в `RecipeBookSideRibbons.js`
- **Layout/padding правки** в `layout.css`, `recipe_book.css`, `recipe_book_left_page.css`, `arc_bento_header.css`, `side_tab_ribbon.css`

**Конфликт** был в `RecipeBookLeftPage._getListHierarchy` — наш код с `getRecipeCats()` хелпером сохранён, legacy-фильтр из ветки стилей отброшен.

---

## 📁 Затронутые файлы (итого)

| Файл | Тип изменения |
|---|---|
| `src/components/recipe_book/RecipeCreateForm.js` | Баг-фиксы: фото, категории, чипсы |
| `src/components/recipe_book/left_page/RecipeBookLeftPage.js` | Баг-фикс: категории, мерж стилей |
| `src/components/recipe_book/RecipeBook.js` | Баг-фикс: live re-render, мерж callback |
| `src/components/recipe_book/RecipeBookRightPage.js` | Без изменений (event уже был) |
| `src/components/ui_kit/arc_lightbox/ArcLightbox.js` | Баг-фикс: prev/next |
| `src/components/recipe/RecipeOverview.js` | Мерж: accordion expanded |
| `src/components/recipe/Recipe.js` | Мерж: render instructions on mount |
| `src/components/recipe_book/RecipeBookSideRibbons.js` | Мерж: updateActiveCategory |
| `src/styles/layout.css` | Мерж: padding правки |
| `src/components/recipe_book/recipe_book.css` | Мерж: стили |
| `.gitignore` | Добавлены temp файлы |

---

## 🏗 Архитектурные решения

### Гибридная схема медиа
Рецепты теперь поддерживают смешанный массив `data.media.images[]`:
- **UUID** — ссылка на `MediaAsset` в бэкенде
- **HTTP URL** — прямая ссылка на Supabase Storage

Фронтенд определяет тип по `startsWith('http')`.

### Многокатегорийность
Рецепт может принадлежать нескольким категориям одновременно:
- Записывается как `data.categories: ["Fish", "Soup"]` (массив)
- Legacy `data.category: "Fish, Soup"` (строка) — поддерживается через `.split(',')`
- Один рецепт считается в счётчике каждой из своих категорий

### Событийная модель обновлений
- `recipe-updated` → `RecipeBook._loadRecipes()` → перезагрузка левой панели
- `eatpan-categories-changed` → `RecipeBookLeftPage._loadOfficialCategories()` → перезагрузка категорий
