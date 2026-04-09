# Prompt: Add New SPA Module

Use this prompt template when asking an agent to add a new section module.

---

## Prompt Template

```
Добавь новый модуль "[MODULE_NAME]" в EatPan SPA.

Контекст проекта:
- Vanilla JS ES-модули, без фреймворков
- Новый модуль должен наследоваться от Component (src/core/Component.js)
- Монтируется в section_block data-index="[INDEX]" в index.html
- Все глобальные функции регистрировать как window.*

Что нужно создать:
1. src/modules/[module-name]/[ModuleName]Module.js  — точка входа
2. src/modules/[module-name]/components/            — компоненты
3. src/modules/[module-name]/styles/[module].css    — стили
4. Подключить CSS в index.html <head>
5. Смонтировать в main.js DOMContentLoaded

Требования к дизайну:
- Придерживаться дизайн-токенов из global.css (:root переменные)
- Использовать Lucide Icons (data-lucide атрибут)
- Не использовать inline <style> блоки
```

---

## Variables to Fill
- `MODULE_NAME` — название модуля (напр. "My Kitchen")
- `INDEX` — data-index блока (1, 3, 4 — доступны)
- `module-name` — папка kebab-case (напр. `kitchen`)
- `ModuleName` — PascalCase (напр. `Kitchen`)
