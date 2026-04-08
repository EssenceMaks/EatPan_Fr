---
description: How to create a new component for EatPan Frontend v2
---

# SKILL: Creating a New Component

## Файлова Структура Компонента

Кожен компонент — ізольована директорія під `src/components/{component_name}/`:

```
src/components/{component_name}/
├── {ComponentName}.js       ← extends Component (ОБОВ'ЯЗКОВО)
├── {component_name}.css     ← стилі, CSS Grid для layout (ОБОВ'ЯЗКОВО)
└── {component_name}.html    ← шаблон (ОПЦІОНАЛЬНО — якщо template() занадто складний)
```

## Кроки Створення

### 1. Створити директорію
```bash
mkdir src/components/{component_name}
```

### 2. Створити JS файл — `{ComponentName}.js`
```javascript
import Component from '../../core/Component.js';

export default class MyComponent extends Component {
  constructor(props = {}) {
    super(props);
    // Ініціалізація стану
    this.someState = null;
  }

  async template() {
    // ⚠️ ОБОВ'ЯЗКОВО: display:grid для layout
    // ⚠️ ОБОВ'ЯЗКОВО: Lucide іконки (data-lucide), НІЯКИХ emoji
    return `
      <div class="my-component">
        <div class="my-component__header">
          <i data-lucide="icon-name"></i>
          <h3>Title</h3>
        </div>
        <div class="my-component__body">
          <p>Content</p>
        </div>
      </div>
    `;
  }

  async onMount() {
    // DOM queries через scoped методи
    this.header = this.$('.my-component__header');
    this.body = this.$('.my-component__body');

    // Event binding
    this.header?.addEventListener('click', () => this._handleClick());

    // ⚠️ ОБОВ'ЯЗКОВО: ініціалізація Lucide після dynamic HTML
    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  onDestroy() {
    // Cleanup: таймери, listeners, інтервали
    clearInterval(this._timer);
  }

  // Приватні методи — з підкресленням
  _handleClick() {
    console.log('Clicked!');
  }
}
```

### 3. Створити CSS файл — `{component_name}.css`
```css
/* ⚠️ ОБОВ'ЯЗКОВО: display:grid для internal layout */
.my-component {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  padding: var(--space-md);
}

.my-component__header {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  color: var(--text-accent);
  font-family: var(--font-title);
}

.my-component__body {
  display: grid;
  /* ... */
}
```

### 4. Зареєструвати CSS в `index.html`
```html
<link rel="stylesheet" href="./src/components/{component_name}/{component_name}.css">
```

### 5. Імпортувати та використати з батьківського компонента
```javascript
import MyComponent from '../my_component/MyComponent.js';

// В onMount() батьківського компонента:
this.myComp = new MyComponent({ key: 'value' });
await this.myComp.render(document.getElementById('target'), 'innerHTML');
```

## Режими Рендерингу (render modes)
- `'innerHTML'` — очищує target, вставляє компонент (default)
- `'appendChild'` — додає в кінець target
- `'prepend'` — додає на початок target
- `'replace'` — замінює target елемент

## Lifecycle Methods
| Метод | Коли | Для чого |
|---|---|---|
| `constructor(props)` | Створення екземпляру | Ініціалізація стану, збереження props |
| `template()` | Перед render | Повертає HTML-рядок |
| `onMount()` | Після вставки в DOM | DOM queries, event binding, lucide.createIcons() |
| `onDestroy()` | Перед видаленням | Cleanup: timers, listeners |
| `update()` | Коли потрібно перемалювати | Re-render на місці |
| `destroy()` | Видалення компонента | Виклик onDestroy() + видалення з DOM |

## Scoped DOM Queries
- `this.$('.selector')` — querySelector всередині компонента
- `this.$$('.selector')` — querySelectorAll (повертає Array)

## Обов'язкові Правила
1. **CSS Grid** — `display: grid` для БУДЬ-ЯКОГО internal layout
   - Виняток: горизонтальна прокрутка каруселі (`display: flex`)
2. **Lucide Icons** — `<i data-lucide="icon-name"></i>` + `lucide.createIcons()`
   - **НІКОЛИ** emoji як іконки в UI
3. **CSS Variables** — використовувати токени з `tokens.css` (`--bg-card`, `--text-accent`, etc.)
4. **Окремий CSS файл** — НІЯКИХ inline `<style>` блоків
5. **ES Modules** — `import`/`export default`, НІЯКИХ CommonJS
6. **window.functionName** — тільки якщо потрібно для inline HTML onclick

## Callbacks між Компонентами
Замість глобальних event bus — props-based callbacks:
```javascript
// Батьківський компонент:
this.child = new ChildComponent({
  onAction: (data) => this._handleChildAction(data),
});

// Дочірній компонент:
this.props.onAction?.('some-data');
```
