# EatPan — Claude Agent Onboarding

## Project Overview
EatPan — SPA «Цифровая книга рецептов». Vanilla JS + ES-модули, без фреймворков и сборщиков. Открывается напрямую через Live Server.

## Reading Order
1. `rules/project_rules.md` — правила и конвенции
2. `steps/architecture_overview.md` — архитектура и схема
3. `index.html` → `main.js` → `src/modules/recipe-book/BookModule.js`

## Component Lifecycle
```js
// Каждый компонент:
class MyComponent extends Component {
    template() { return `<div>...</div>`; }  // HTML строка
    attachEvents() { /* события */ }          // вешать после render
    async onMount() { /* async init */ }      // после создания DOM
    // render() автоматически вызывает все три
}

// Использование:
const comp = new MyComponent({ prop: value });
const el = await comp.render();
container.appendChild(el);
lucide.createIcons(); // если есть data-lucide иконки
```

## Global Functions Pattern
```js
// В main.js — все функции для HTML onclick:
window.setChapter = function(chap) { ... };
window.openCategory = function(catId, event) { ... };
window.toggleEdit = function() { ... };
window.updateFilterIconState = function() { ... };
window.goBack = () => history.back();
```

## Adding a New Module
1. Создай папку `src/modules/your-module/`
2. Создай `YourModule.js` наследующий `Component`
3. Добавь место в `index.html` (section_block)
4. Смонтируй в `main.js` в `DOMContentLoaded`
5. Подключи CSS в `<head>` index.html

## File Watch List (чаще всего меняются)
- `main.js` — единственное место для новой SPA-логики
- `PageLeft.js` / `PageRight.js` — контент книги
- `global.css` — глобальные стили

## Current Limitations
- Нет HMR/hot-reload — нужен жёсткий перезапуск браузера
- API — заглушка в `RecipeService.js`, Django ещё не подключён
- `Ribbon.js` создан но **не используется** в PageLeft/PageRight (используются прямые div'ы в template)
