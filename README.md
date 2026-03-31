# EatPan 🍳

> **⚠️ Інформація для ШІ-агентів (AI Context)**
> 
> Цей проєкт активно розробляється за допомогою ШІ-агентів. 
> Всі ключові правила проєкту, архітектурні вимоги, дизайн-система та воркфлоу (workflows) зберігаються у прихованій директорії **`.agents/`**.
>
> **ПРИ ОЗНАЙОМЛЕННІ З ПРОЄКТОМ АГЕНТИ ПОВИННІ:**
> 1. Жорстко перевіряти `.agents/rules/...` перед внесенням будь-яких системних або UI змін (зокрема `project_rules.md` та `sync_with_figma.md`).
> 2. Слідувати воркфлоу, описаним у `.agents/workflows/...` (наприклад `/wrap_up`).
> 3. Фіксувати всі зміни у кореневому файлі `CHANGELOG.md`.

## Структура Проєкту

- `/.agents/` – Директорія з правилами та контекстом для ШІ.
- `/src/` – Основний код додатку (SCSS/CSS, модулі JavaScript).
- `/docs/` – Документація для користувача, Markdown-файли задач (`tasks.md`).
- `CHANGELOG.md` – Глобальний лог змін та оновлень проєкту.
- `index.html` – Головна точка входу.

меню внизу а не вверху
@media (min-width: 320px) and (max-width: 479px) and (orientation: portrait)
@media (min-width: 320px) and (max-width: 479px) and (orientation: landscape)
@media (min-width: 480px) and (max-width: 767px) and (orientation: portrait)
@media (min-width: 480px) and (max-width: 767px) and (orientation: landscape)
@media (min-width: 768px) and (max-width: 1023px) and (orientation: portrait)
@media (min-width: 768px) and (max-width: 1023px) and (orientation: landscape)


меню сверху
@media (min-width: 1024px) and (max-width: 1199px) and (orientation: portrait)
@media (min-width: 1024px) and (max-width: 1199px) and (orientation: landscape)
@media (min-width: 1200px) and (max-width: 1439px)
@media (min-width: 1440px) and (max-width: 1919px)
@media (min-width: 1024px) and (max-width: 1199px) and (max-height: 750px) and (orientation: landscape) {
@media (min-width: 1200px) and (max-width: 1439px) and (max-height: 750px)
@media (min-width: 1440px) and (max-width: 1919px) and (max-height: 850px)
@media (min-width: 1920px) and (max-height: 950px)
@media (min-width: 1920px)