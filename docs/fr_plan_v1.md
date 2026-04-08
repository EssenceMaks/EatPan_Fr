# UI Kit Dashboard — Implementation Plan v2.1

## Цель

Создать набор **атомарных UI-компонентов** в `src/components/ui_kit/`, которые являются "кирпичиками" для построения **больших компонентов** (`bento_header/`, `dialog_box/` и т.д.) в `src/components/`. Демо-страница `ui_kit.html` — витрина для визуализации и тестирования всех элементов.

## Архитектура проекта (как есть)

```
main.js → AppShell.init()
              │
              ├── SectorCarousel (render → #sector-carousel)
              │     └── Sectors (Hero, Kitchen...) + Wedges (Clock, Profile, Auth)
              │
              └── MenuOverlay (render → #menu-overlay)
                    └── ThemeSwitcher + ActionButtons
```

**Паттерн монтирования:**
1. `index.html` содержит DOM-каркас (`#app`, `#sector-carousel`, `#menu-overlay`)
2. `main.js` → `new AppShell()` → `.init()` (НЕ `.render()`, т.к. DOM уже есть) 
3. AppShell создаёт дочерние компоненты через `new Component(props)` → `.render(target, mode)`
4. Каждый компонент: `extends Component` → `template()` → `onMount()` → `onDestroy()`
5. CSS подключается через `<link>` в `index.html`
6. Связь между компонентами: **props-based callbacks** (НЕ event bus)

---

## Иерархия компонентов: Атомарные vs Составные

### Уровень 1: Атомарные (ui_kit/) — маленькие "кирпичики"

Это примитивы, которые не содержат бизнес-логику. Их можно переиспользовать повсюду.

| # | Компонент | Что делает | Из какого референса |
|---|---|---|---|
| 1 | **UiButton** | Любая кнопка с вариантами: concave, convex, radial, pill, ingot | ref_15, ref_17 |
| 2 | **UiButtonHex** | Гексагональная кнопка (3 варианта бордера) | ref_15, ref_17 |
| 3 | **UiButtonCombo** | Составная кнопка (иконка + текст, центр / LTR) | ref_17 |
| 4 | **UiShieldBadge** | Иконка-щит (обычный / двойной бордер) | ref_15, ref_17 |
| 5 | **UiDiamondIcon** | Ромбовидная иконка (hollow / filled) | ref_17 |
| 6 | **UiNavIcon** | Навигационная иконка-кнопка (circle/square × 6 бордеров) | ref_17 |
| 7 | **UiStatBar** | Полоса прогресса (HP/MP/EXP/Stamina — цвет через props) | ref_15, ref_17, user_ref_v3 |
| 8 | **UiSegmentBar** | Сегментированная полоса (стамина) | ref_17, user_ref_v3 |
| 9 | **UiProgressHex** | Прогресс-бар с гексагональной меткой | ref_15 |
| 10 | **UiSlider** | Ползунок (4 варианта: default, diamond, hex, hex-diamond) | ref_15 |
| 11 | **UiInput** | Текстовое поле ввода (RPG-тема) | ref_15 |
| 12 | **UiDropdown** | Раскрывающийся список | ref_15 |
| 13 | **UiAlertRibbon** | Уведомление-лента (success/warning/error × inward/outward) | ref_17 |
| 14 | **UiPaperSlip** | Карточка "записка" с сургучной печатью | ref_17 |
| 15 | **UiDivider** | Разделитель с ромбом-иконкой | ref_15, ref_17 |
| 16 | **UiSectionTitle** | Заголовок секции | ref_15, ref_17 |
| 17 | **UiHexAvatar** | Гексагональный аватар с лентой уровня | ref_17, user_ref_v3 |
| 18 | **UiCornerGaltel** | Галтель (flared corner mask) для Bento-панелей | ref_17, user_ref_v3 |

### Уровень 2: Составные (components/) — большие блоки из атомарных

Эти компоненты живут на уровне `src/components/` рядом с AppShell, Menu и т.д. Они **импортируют** атомарные компоненты из `ui_kit/` и собирают их вместе.

| # | Компонент | Из чего собран (ui_kit) | Где используется |
|---|---|---|---|
| A | **BentoHeader** | UiHexAvatar + UiStatBar + UiSegmentBar + UiCornerGaltel + UiNavIcon | Будущая замена текущего `#app-header` |
| B | **DialogPanel** | UiButton + UiDivider + UiSectionTitle | Внутри секторов (квесты) |
| C | **PaperBoard** | UiPaperSlip × N + UiSectionTitle | Внутри секторов (доска объявлений) |
| D | **PopupModal** | UiButton + UiInput | Модальное окно |
| E | **TopBarParchment** | UiStatBar × 2 + UiShieldBadge | Альтернативная шапка профиля |
| F | **TopBarCompact** | UiStatBar + UiShieldBadge | Компактная шапка |

---

## Структура файлов

### Атомарные компоненты (ui_kit/)

```
src/components/ui_kit/
├── ui_button/
│   ├── UiButton.js          ← props: { variant, label, icon, onClick }
│   └── ui_button.css
├── ui_button_hex/
│   ├── UiButtonHex.js        ← props: { variant, label, colorClass }
│   └── ui_button_hex.css
├── ui_button_combo/
│   ├── UiButtonCombo.js      ← props: { icon, label, align, bgStyle }
│   └── ui_button_combo.css
├── ui_shield_badge/
│   ├── UiShieldBadge.js      ← props: { icon, variant }
│   └── ui_shield_badge.css
├── ui_diamond_icon/
│   ├── UiDiamondIcon.js      ← props: { icon, filled }
│   └── ui_diamond_icon.css
├── ui_nav_icon/
│   ├── UiNavIcon.js          ← props: { icon, shape, borderStyle }
│   └── ui_nav_icon.css
├── ui_stat_bar/
│   ├── UiStatBar.js          ← props: { label, value, max, colorVar }
│   └── ui_stat_bar.css
├── ui_segment_bar/
│   ├── UiSegmentBar.js       ← props: { filled, total }
│   └── ui_segment_bar.css
├── ui_progress_hex/
│   ├── UiProgressHex.js      ← props: { label, value, max, color }
│   └── ui_progress_hex.css
├── ui_slider/
│   ├── UiSlider.js           ← props: { variant, value, min, max }
│   └── ui_slider.css
├── ui_input/
│   ├── UiInput.js            ← props: { placeholder, value }
│   └── ui_input.css
├── ui_dropdown/
│   ├── UiDropdown.js         ← props: { options[], selected }
│   └── ui_dropdown.css
├── ui_alert_ribbon/
│   ├── UiAlertRibbon.js      ← props: { type, title, desc, direction }
│   └── ui_alert_ribbon.css
├── ui_paper_slip/
│   ├── UiPaperSlip.js        ← props: { icon, text, sealColor }
│   └── ui_paper_slip.css
├── ui_divider/
│   ├── UiDivider.js          ← props: {}
│   └── ui_divider.css
├── ui_section_title/
│   ├── UiSectionTitle.js     ← props: { text }
│   └── ui_section_title.css
├── ui_hex_avatar/
│   ├── UiHexAvatar.js        ← props: { avatarUrl, level }
│   └── ui_hex_avatar.css
└── ui_corner_galtel/
    ├── UiCornerGaltel.js     ← props: { position }
    └── ui_corner_galtel.css
```

### Составные компоненты (components/)

```
src/components/
├── bento_header/
│   ├── BentoHeader.js        ← import UiHexAvatar, UiStatBar, UiSegmentBar, UiCornerGaltel
│   └── bento_header.css
├── dialog_panel/
│   ├── DialogPanel.js
│   └── dialog_panel.css
├── paper_board/
│   ├── PaperBoard.js
│   └── paper_board.css
├── popup_modal/
│   ├── PopupModal.js
│   └── popup_modal.css
├── top_bar_parchment/
│   ├── TopBarParchment.js
│   └── top_bar_parchment.css
└── top_bar_compact/
    ├── TopBarCompact.js
    └── top_bar_compact.css
```

### Демо-страница

```
ui_kit.html                   ← отдельная standalone страница
ui_kit_main.js                ← entry point для ui_kit.html
```

---

## Пример: Как атомарный компонент используется в составном

```javascript
// src/components/bento_header/BentoHeader.js
import Component from '../../core/Component.js';
import UiHexAvatar from '../ui_kit/ui_hex_avatar/UiHexAvatar.js';
import UiStatBar from '../ui_kit/ui_stat_bar/UiStatBar.js';
import UiSegmentBar from '../ui_kit/ui_segment_bar/UiSegmentBar.js';

export default class BentoHeader extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    return `
      <div class="bento-header">
        <div class="bento-header__left bento-panel">
          <div class="bento-header__avatar" id="bh-avatar"></div>
          <div class="bento-header__stats" id="bh-stats"></div>
        </div>
        <div class="bento-header__right bento-panel" id="bh-menu-btn">
          <i data-lucide="menu"></i>
        </div>
      </div>
    `;
  }

  async onMount() {
    // Mount child ui_kit components
    this.avatar = new UiHexAvatar({ level: 42 });
    await this.avatar.render(this.$('#bh-avatar'), 'innerHTML');

    this.hpBar = new UiStatBar({ label: 'HP', value: 850, max: 1000, colorVar: 'hp' });
    await this.hpBar.render(this.$('#bh-stats'), 'appendChild');

    this.mpBar = new UiStatBar({ label: 'MP', value: 600, max: 1000, colorVar: 'mp' });
    await this.mpBar.render(this.$('#bh-stats'), 'appendChild');

    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  onDestroy() {
    this.avatar?.destroy();
    this.hpBar?.destroy();
    this.mpBar?.destroy();
  }
}
```

---

## Демо-страница `ui_kit.html`

Standalone HTML — **отдельная от основного приложения**. Не использует AppShell, SectorCarousel. Просто подключает все CSS-файлы и рендерит каждый компонент в свою секцию.

```
ui_kit.html
├── <link> → tokens.css, themes.css, все ui_kit/*.css, все составные/*.css
├── <script src="lucide">
├── <div id="ui-kit-app">
│   ├── ThemeSwitcher (blue/red/green — NOT отдельный компонент, встроен)
│   ├── Section: Buttons (UiButton × variants)
│   ├── Section: Hex Buttons (UiButtonHex × variants)
│   ├── Section: Combo Buttons
│   ├── Section: Badges (Shield + Diamond + Nav)
│   ├── Section: Bars (StatBar + SegmentBar + ProgressHex)
│   ├── Section: Sliders
│   ├── Section: Form (Input + Dropdown)
│   ├── Section: Alerts
│   ├── Section: Paper Slips
│   ├── Section: Decorative (Divider + SectionTitle)
│   ├── Section: Avatars (HexAvatar + Galtel)
│   └── Section: Assembled (BentoHeader, DialogPanel, PaperBoard)
└── <script type="module" src="./ui_kit_main.js">
```

**Маршрут:** `http://localhost:6800/ui_kit.html`

---

## Порядок реализации

### Фаза 1: Фундамент
1. Добавить недостающие CSS-токены в `tokens.css` (RPG bar colors, theme-specific vars из референсов)
2. Создать `ui_kit.html` + `ui_kit_main.js` (каркас демо-страницы)

### Фаза 2: Атомарные компоненты (ui_kit/)
Порядок по зависимостям (сначала те, которые ни от кого не зависят):
1. `UiDivider` + `UiSectionTitle` (декоративные, простейшие)
2. `UiButton` (concave/convex/radial/pill/ingot)
3. `UiButtonHex` (3 варианта бордера)
4. `UiButtonCombo` (icon + text)
5. `UiShieldBadge` + `UiDiamondIcon` + `UiNavIcon`
6. `UiStatBar` + `UiSegmentBar` + `UiProgressHex`
7. `UiSlider` + `UiInput` + `UiDropdown`
8. `UiAlertRibbon` + `UiPaperSlip`
9. `UiHexAvatar` + `UiCornerGaltel`

### Фаза 3: Составные компоненты (components/)
1. `BentoHeader` (собирает HexAvatar + StatBar + SegmentBar + CornerGaltel)
2. `DialogPanel` (собирает Button + Divider + SectionTitle)
3. `PaperBoard` (собирает PaperSlip × N)
4. `TopBarParchment` + `TopBarCompact`
5. `PopupModal`

### Фаза 4: Dashboard Assembly
1. Импортировать все компоненты в `ui_kit_main.js`
2. Рендерить каждый по секциям
3. Добавить theme-switcher
4. Финальная проверка визуала

### Фаза 5: Интеграция в основное приложение (будущее)
Когда UI Kit готов — отдельными задачами:
- Заменить `#app-header` на `BentoHeader`
- Встроить `DialogPanel` в сектор Hero
- Обновить `MenuOverlay` с использованием `UiButton`

---

## User Review Required

> [!IMPORTANT]
> **Разделение атомарных / составных**: 18 атомарных компонентов в `ui_kit/` + 6 составных в `components/`. Это правильная гранулярность?

> [!IMPORTANT]
> **Демо-страница**: `ui_kit.html` + `ui_kit_main.js` в корне проекта — standalone, без AppShell. Согласен?

> [!WARNING]
> **CSS-префиксы**: Атомарные компоненты будут использовать префикс `.ui-` для классов (`.ui-button`, `.ui-stat-bar`), чтобы избежать конфликтов с существующими классами в `layout.css` и `tokens.css`.

---

## Open Questions

1. **ThemeSwitcher на demo-странице** — использовать упрощённый inline-вариант (3 кнопки blue/red/green из референса) или полноценный из MenuOverlay (9 тем)?
2. **Именование**: `UiButton` vs `RpgButton`? Какой prefix предпочтительнее?
3. **Стоит ли начать сразу или хочешь скорректировать список компонентов?**

---

## Verification Plan

### Automated
- Открыть `http://localhost:6800/ui_kit.html` → визуально сравнить каждую секцию с оригинальным ref_17.html
- Переключить темы → убедиться, что все компоненты адаптируются
- Проверить Lucide иконки (`lucide.createIcons()` для каждого)
- Проверить, что `index.html` (основное приложение) не сломалось

### Manual
- Скриншоты dashboard vs референсы
- Каждый JS-компонент: `extends Component`, `template()`, `onMount()`, `onDestroy()`
- Каждый CSS-файл: `display: grid`, CSS-переменные из tokens.css
