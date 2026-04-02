# PageLeft: ліві вкладки та фонова сітка

## Що саме тут описано

Цей файл пояснює, як у `src/modules/recipe_book_sector/components/layout/PageLeft.js` формується ліва зона вкладок книги:

- категорійні `side-tab--left`
- службові health-tabs `side-tab--left`
- фонові колонки `side-tabs-bg-sheet`

Документ потрібен для швидкого розуміння, **де змінюється кількість колонок / рядків**, а де змінюється лише їхній візуальний розмір через адаптивні стилі.

---

## Головне правило

Кількість `side-tab--left` та `side-tabs-bg-sheet` регулюється **переважно в JavaScript**, а не в CSS.

CSS у `src/modules/recipe_book_sector/styles/ribbons.css` та `src/modules/recipe_book_sector/styles/media_queries.css`:

- задає зовнішній вигляд вкладок
- зменшує або збільшує їхню ширину / висоту
- коригує іконки та hover-ефекти

Але саме **скільки колонок і рядків буде відмальовано** вирішує `PageLeft.js`.

---

## Де це обчислюється в коді

### 1. Базовий стан

У state компонента є поле:

```js
maxRibbonRows: 9
```

Це стартове значення максимальної кількості рядків для лівої сітки вкладок.

---

### 2. Реальна кількість рядків залежить від доступної висоти

У `onMount()` створюється `ResizeObserver`, який щоразу після зміни розміру контейнера перераховує доступну висоту для зони ribbon-вкладок.

Ключова формула:

```js
const availableHeight = ribbonsContainer.clientHeight - offset - 10;
let newMaxRows = Math.floor((availableHeight + 8) / 43);
if (newMaxRows < 5) newMaxRows = 5;
```

Розшифровка:

- `offset` — це відступ зверху до блоку `.grid-categories`
- `availableHeight` — скільки вертикального простору реально лишилось під ліві вкладки
- `43` — це приблизний крок одного рядка: висота вкладки `35px` + проміжок `8px`
- мінімум жорстко обмежено до `5`, щоб умістити службові нижні вкладки

Після цього компонент робить `update()` і перерендерює всю сітку.

Отже, **прив'язка до розміру екрана відбувається через доступну висоту контейнера**, а не через прямий switch по breakpoint-ах.

---

### 3. Кількість health-tabs

Масив службових вкладок задається тут:

```js
const healthTabsDef = [ ... ]
```

Далі в нього динамічно додаються невидимі spacer-елементи:

```js
if (maxRows >= 6) {
    healthTabsDef.unshift({ invisible: true });
}

if (maxRows >= 7 && window.innerHeight >= 700) {
    healthTabsDef.push({ invisible: true });
}
```

Що це означає:

- при достатній кількості рядків зверху додається порожній spacer
- при ще більшій висоті й `window.innerHeight >= 700` додається нижній spacer
- самі `invisible` елементи не рендеряться як вкладки, але впливають на вертикальну розкладку

Тобто висота екрана впливає не лише на `maxRibbonRows`, а й на те, чи буде використаний нижній візуальний spacer.

---

### 4. Кількість колонок категорійних вкладок

Після визначення `maxRows` і `healthTabsLen` код рахує, скільки колонок потрібно для всіх категорій:

```js
let catCount = allCats.length + (cat !== 'all' ? 1 : 0);
let requiredCols = 1;

let rightmostCatSlots = maxRows - healthTabsLen;
if (rightmostCatSlots < 0) rightmostCatSlots = 0;

let cLeft = catCount;
cLeft -= rightmostCatSlots;
while (cLeft > 0) {
    requiredCols++;
    cLeft -= maxRows;
}
```

Логіка така:

- права крайня колонка частково зайнята health-tabs
- зверху в ній лишається лише `rightmostCatSlots` місць для звичайних категорій
- якщо категорій більше, ніж поміщається, додаються нові колонки ліворуч

Отже:

- **більше категорій** → більше `requiredCols`
- **менше доступної висоти** → менше `maxRows` → менше слотів у колонці → більше шансів, що колонок стане більше

---

### 5. Звідки беруться `side-tabs-bg-sheet`

Фонові листи створюються не окремо руками, а автоматично з множини активних колонок:

```js
const bgSheetsHTML = Array.from(activeCols).map(col => `
    <div class="side-tabs-bg-sheet" style="grid-column: ${col}; grid-row: 1 / -1;"></div>
`).join('');
```

`activeCols` наповнюється в процесі розкладки `renderedRibbons`.

Практично це означає:

- **скільки реально задіяно колонок вкладок**
- **стільки ж буде `side-tabs-bg-sheet`**

Тобто кількість `side-tabs-bg-sheet` напряму залежить від `requiredCols` / `activeCols`.

---

### 6. Де рендеряться самі `side-tab--left`

Є два джерела HTML:

- `healthTabsHTML` — службові вкладки в правій колонці
- `ribbonsHTML` — категорійні вкладки та reset-tab

Обидва блоки вставляються в:

```html
<div class="side-tabs-grid-inner" style="grid-template-columns: repeat(${requiredCols}, 55px); grid-template-rows: repeat(${maxRows}, 35px);">
```

Саме тут видно два головні параметри layout:

- `requiredCols` — кількість колонок
- `maxRows` — кількість рядків

---

## Що регулювати, якщо потрібно змінити поведінку

### Якщо потрібно змінити кількість рядків залежно від висоти

Редагувати в `PageLeft.js`:

- формулу `newMaxRows = Math.floor((availableHeight + 8) / 43)`
- мінімум `if (newMaxRows < 5) newMaxRows = 5`
- умову нижнього spacer: `window.innerHeight >= 700`

---

### Якщо потрібно змінити кількість колонок

Редагувати в `PageLeft.js`:

- логіку `requiredCols`
- розрахунок `rightmostCatSlots`
- правила розкладки `renderedRibbons` та `activeCols`

---

### Якщо потрібно лише зменшити фізичний розмір вкладок на малих екранах

Редагувати в CSS:

- `src/modules/recipe_book_sector/styles/ribbons.css`
- `src/modules/recipe_book_sector/styles/media_queries.css`

Зокрема зараз у low-height landscape є блок:

```css
@media (min-width: 768px) and (orientation: landscape) and (max-height: 900px)
```

У ньому змінюються:

- ширина `side-tab--left`
- висота `side-tab--left`
- `padding-right`
- розмір іконок
- active transform

Але цей media block **не змінює кількість колонок напряму**.

---

## Коротка відповідь на практичне питання

### Де задається кількість `side-tab--left` в залежності від екрану?

У `PageLeft.js`, через:

- `ResizeObserver`
- `this.state.maxRibbonRows`
- обчислення `requiredCols`
- масиви `healthTabsDef` / `renderedRibbons`

### Де задається кількість `side-tabs-bg-sheet`?

У `PageLeft.js`, через:

- `activeCols`
- генерацію `bgSheetsHTML`

### Де це не регулюється?

Не в `media_queries.css` як джерело кількості. Там змінюється лише геометрія елементів.

---

## Якщо треба швидко втрутитися в поведінку

Найчастіше дивитися сюди:

1. `PageLeft.js` → `onMount()` → `ResizeObserver`
2. `PageLeft.js` → блок `Ribbons Grid Calculation`
3. `PageLeft.js` → `bgSheetsHTML`, `healthTabsHTML`, `ribbonsHTML`
4. `media_queries.css` → тільки для візуального масштабу

---

## Пов'язані файли

- `src/modules/recipe_book_sector/components/layout/PageLeft.js`
- `src/modules/recipe_book_sector/styles/ribbons.css`
- `src/modules/recipe_book_sector/styles/media_queries.css`
- `src/modules/recipe_book_sector/styles/book.css`
