# EatPan — Gemini Agent Onboarding

## Project Overview
EatPan — это SPA-приложение «Цифровая книга рецептов», построенное на чистом Vanilla JS с ES-модулями. Без фреймворков, без бандлеров.

## Start Here
1. Прочитай `rules/project_rules.md` — архитектура, стек, конвенции
2. Прочитай `steps/architecture_overview.md` — схема модулей и потоки данных
3. Открой `index.html` и `main.js` чтобы понять точку входа

## File Map (быстрый ориентир)
| Хочешь изменить... | Иди в... |
|--------------------|----------|
| Глобальный UI (header, блоки, часы) | `index.html` + `global.css` |
| SPA логику (скролл, часы, история) | `main.js` |
| Левую страницу книги | `src/modules/recipe-book/components/layout/PageLeft.js` |
| Правую страницу книги | `src/modules/recipe-book/components/layout/PageRight.js` |
| Стили книги | `src/modules/recipe-book/styles/book.css` |
| Ленты/вкладки | `src/modules/recipe-book/styles/ribbons.css` |
| Адаптивность | `src/modules/recipe-book/styles/media.css` |
| API-запросы | `src/api/RecipeService.js` |
| Базовый компонент | `src/core/Component.js` |

## Important Gotchas
- Функции вызываемые в `onclick="..."` в HTML-шаблонах **должны** быть на `window.*`
- `render()` в Component — **async**, всегда `await` при вызове
- После изменений в JS-компонентах в браузере нужен **жёсткий перезапуск** (Ctrl+Shift+R), т.к. ES-модули кешируются
- Не добавляй Lucide иконки вручную — вызови `lucide.createIcons()` после рендеринга

## Current State (March 2026)
- Модуль recipe-book: ✅ Полностью перенесён из монолита
- API: 🟡 Mock данные (заглушка под Django)
- Другие секции (Hero, Kitchen, Supplies, Timetable): 🔲 Placeholder-контент
