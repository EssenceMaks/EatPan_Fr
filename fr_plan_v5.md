# UI Kit Dashboard — Implementation Plan v2.3 (Arc Design System)

## Цель

Создать набор **атомарных UI-компонентов** в `src/components/ui_kit/`, используя дизайн-систему **Arc** — вдохновлённую миром Arcanum: алхимия, рунические механизмы, паровые кристаллы, викторианская магия. Атомарные = "кирпичики" для **составных компонентов** в `src/components/`. Демо-страница `ui_kit.html` — витрина.

---

## Arc Naming Convention

Вокабуляр лаборатории алхимика-изобретателя. Без слова "Arcanum" напрямую, без "Hex".

| Термин | Происхождение | Значение в UI | Применение |
|---|---|---|---|
| **Glyph** | Магический символ-действие | Действие, клик, активация | Кнопки, action-элементы |
| **Sigil** | Магическая печать | Визуальный символ, знак | Щиты, бейджи, ромбы |
| **Flux** | Поток энергии | Течение, заполнение | Бары HP/MP/EXP, прогресс |
| **Edge** | Грань кристалла | Рамка, срез, угол | Разделители, галтели |
| **Spark** | Искра механизма | Мгновенная обратная связь | Алерты, уведомления |
| **Arc** | Дуга, свод (лаборатория) | Контейнер, оболочка | Панели, попапы, свитки |
| **Core** | Ядро кристалла | Центральный элемент | Аватар, идентичность |
| **Gear** | Шестерня, механизм | Ввод, настройка, контроль | Слайдеры, инпуты, дропдауны |
| **Rune** | Руна, надпись | Метка, заголовок секции | Заголовки, подписи |
| **Gilt** | Позолота | Декоративный акцент | Бордеры, рамки |
| **Void** | Пустота | Отключённое состояние | Disabled, empty state |
| **Lux** | Свет (чистая энергия) | Свечение, hover, focus | Active/glow-эффекты |

### CSS prefix: `arc-`
```css
.arc-glyph-concave { }   /* Впуклая кнопка */
.arc-flux-bar { }         /* Полоса прогресса */
.arc-spark-ribbon { }     /* Уведомление */
.arc-edge-divider { }     /* Разделитель */
.arc-sigil-shield { }     /* Щит-бейдж */
```

### JS-класс naming: `{Category}{Name}`
```javascript
GlyphButton       // Кнопка-символ
SigilShield       // Печать-щит
FluxStatBar       // Поток стат-полосы
CoreAvatar        // Ядро аватара
SparkRibbon       // Искра-лента
RuneTitle         // Рунная надпись
GearSlider        // Шестерня-ползунок
```

---

## Theme Switcher — 12 тем

### Группа 1: Dark-Themed (из референсов — `--t-color-*`)
| # | Тема | Glare | Bottom |
|---|---|---|---|
| 1 | **Blue** | `#298d9e` | `#0d3644` |
| 2 | **Red** | `#d65656` | `#360808` |
| 3 | **Green** | `#70c456` | `#0f2908` |

### Группа 2: Из MenuOverlay (9 тем — уже в `themes.css`)
| # | Тема | Ключевой цвет |
|---|---|---|
| 4 | Fantasy | `#c5a044` |
| 5 | Vintage | `#6b0d12` |
| 6 | Royal | `#c5a059` |
| 7 | Bronze | `#cd7f32` |
| 8 | Silver | `#a8b2c1` |
| 9 | Neon | `#00ffff` |
| 10 | Tangerine | `#ff8c00` |
| 11 | Scroll | `#8b4513` |
| 12 | Cyber | `#39ff14` |

---

## Полный реестр компонентов

### Уровень 1: Атомарные (ui_kit/) — 18 компонентов

| # | JS Class | Директория | CSS prefix | Описание | Вариантов |
|---|---|---|---|---|---|
| 1 | **GlyphButton** | `glyph_button/` | `.arc-glyph-` | concave, convex, radial, pill, ingot | 5 |
| 2 | **GlyphRunic** | `glyph_runic/` | `.arc-glyph-runic-` | Рубленые кнопки (clip-path): single, double-side, double-full × 3 цвета | 9 |
| 3 | **GlyphCombo** | `glyph_combo/` | `.arc-glyph-combo-` | Составная кнопка (icon + text): center, ltr | 2 |
| 4 | **GlyphNav** | `glyph_nav/` | `.arc-glyph-nav-` | Навигационная иконка: circle/square × 6 стилей бордера | 12 |
| 5 | **SigilShield** | `sigil_shield/` | `.arc-sigil-shield-` | Щит-бейдж: normal, double-border | 2 |
| 6 | **SigilDiamond** | `sigil_diamond/` | `.arc-sigil-diamond-` | Ромбовидная иконка: hollow, filled | 2 |
| 7 | **FluxStatBar** | `flux_stat_bar/` | `.arc-flux-bar-` | Полоса стата: parchment-style, flared-style | 2 стиля |
| 8 | **FluxSegmentBar** | `flux_segment_bar/` | `.arc-flux-seg-` | Сегментированная стамина | 1 |
| 9 | **FluxProgressBar** | `flux_progress_bar/` | `.arc-flux-prog-` | Прогресс: solid, segmented, pill, theme-color | 4 |
| 10 | **GearSlider** | `gear_slider/` | `.arc-gear-slider-` | Ползунок: default-orb, diamond-thin, runic, runic-diamond, theme-glow | 5 |
| 11 | **GearInput** | `gear_input/` | `.arc-gear-input` | Текстовое поле ввода | 1 |
| 12 | **GearDropdown** | `gear_dropdown/` | `.arc-gear-dropdown-` | Раскрывающийся список | 1 |
| 13 | **SparkRibbon** | `spark_ribbon/` | `.arc-spark-ribbon-` | Алерт-лента: inward/outward × LTR/RTL × 3 типа | 6 |
| 14 | **ArcSlip** | `arc_slip/` | `.arc-slip-` | Бумажная плашка с сургучной печатью | 1 |
| 15 | **EdgeDivider** | `edge_divider/` | `.arc-edge-divider` | Разделитель с ромб-иконкой | 1 |
| 16 | **RuneTitle** | `rune_title/` | `.arc-rune-title` | Заголовок секции (рунная метка) | 1 |
| 17 | **CoreAvatar** | `core_avatar/` | `.arc-core-avatar-` | Изогнутый аватар + лента уровня | 1 |
| 18 | **EdgeGaltel** | `edge_galtel/` | `.arc-edge-galtel-` | Галтель (flared corner mask) | 4 позиции |

### Уровень 2: Составные (components/) — 6 компонентов

| # | JS Class | Директория | Из атомарных | Роль |
|---|---|---|---|---|
| A | **ArcBentoHeader** | `arc_bento_header/` | CoreAvatar + FluxStatBar + FluxSegmentBar + EdgeGaltel + GlyphNav | Flared Bento RPG Header |
| B | **ArcDialog** | `arc_dialog/` | GlyphButton + EdgeDivider + RuneTitle | Пергаментный диалог квестов |
| C | **ArcPaperBoard** | `arc_paper_board/` | ArcSlip × N + RuneTitle | Деревянная доска объявлений |
| D | **ArcPopup** | `arc_popup/` | GlyphButton + GearInput | Модальное окно |
| E | **ArcTopBarParchment** | `arc_top_bar_parchment/` | FluxStatBar × 2 + SigilShield | Шапка профиля (пергамент V1) |
| F | **ArcTopBarCompact** | `arc_top_bar_compact/` | FluxStatBar + SigilShield | Компактная шапка V2 |

---

## Аудит: Все элементы из референсов (полная таблица)

### ref_1 copy 15.html — ✅ полностью
| Блок | → Компонент | ✓ |
|---|---|---|
| Theme Switcher Panel | Dashboard (12 тем) | ✅ |
| Top Bar V1 (parchment) | ArcTopBarParchment | ✅ |
| Top Bar V2 (compact) | ArcTopBarCompact | ✅ |
| Concave / Convex buttons | GlyphButton | ✅ |
| Shields (normal + double) | SigilShield | ✅ |
| Dialog V1 (simple) | ArcDialog | ✅ |
| Dialog V2 (quest + controls) | ArcDialog | ✅ |
| Radial button (diamond accents) | GlyphButton (radial) | ✅ |
| Runic buttons (3 variants × 3 colors) | GlyphRunic | ✅ |
| Diamond icons (hollow/filled) | SigilDiamond | ✅ |
| Pill + Ingot buttons | GlyphButton (pill/ingot) | ✅ |
| Combo buttons (center/ltr) | GlyphCombo | ✅ |
| Paper board + slips | ArcPaperBoard + ArcSlip | ✅ |
| Alerts LTR (3 vars) | SparkRibbon | ✅ |
| Alerts RTL (3 vars) | SparkRibbon | ✅ |
| Input field | GearInput | ✅ |
| Dropdown | GearDropdown | ✅ |
| Slider (default orb) | GearSlider | ✅ |
| Sliders (4 pin variants) | GearSlider | ✅ |
| Progress Bars (4 fill styles) | FluxProgressBar | ✅ |
| Paper Scroll (Свиток) | ArcDialog variant | ✅ |
| Popup Modal | ArcPopup | ✅ |
| Nav Icons (12 combos) | GlyphNav | ✅ |
| Divider | EdgeDivider | ✅ |
| Section Title | RuneTitle | ✅ |

### ref_1 copy 17.html — ✅ полностью
| Блок | → Компонент | ✓ |
|---|---|---|
| Flared Bento Header (left) | ArcBentoHeader | ✅ |
| Flared Bento Header (right + menu) | ArcBentoHeader | ✅ |
| Corner Galtels (4 masks) | EdgeGaltel | ✅ |
| Avatar + Level Ribbon | CoreAvatar | ✅ |
| Player Name + Badge Icons | ArcBentoHeader (inline) | ✅ |
| Flared HP/MP Bars | FluxStatBar (flared) | ✅ |
| Segmented Stamina | FluxSegmentBar | ✅ |
| Flared Menu Button | GlyphNav (flared) | ✅ |

### user_ref_v3.html — ✅ (Bento Header standalone)

---

## Файловая структура

```
src/components/ui_kit/
├── glyph_button/        GlyphButton.js       + glyph_button.css
├── glyph_runic/         GlyphRunic.js        + glyph_runic.css
├── glyph_combo/         GlyphCombo.js        + glyph_combo.css
├── glyph_nav/           GlyphNav.js          + glyph_nav.css
├── sigil_shield/        SigilShield.js       + sigil_shield.css
├── sigil_diamond/       SigilDiamond.js      + sigil_diamond.css
├── flux_stat_bar/       FluxStatBar.js       + flux_stat_bar.css
├── flux_segment_bar/    FluxSegmentBar.js    + flux_segment_bar.css
├── flux_progress_bar/   FluxProgressBar.js   + flux_progress_bar.css
├── gear_slider/         GearSlider.js        + gear_slider.css
├── gear_input/          GearInput.js         + gear_input.css
├── gear_dropdown/       GearDropdown.js      + gear_dropdown.css
├── spark_ribbon/        SparkRibbon.js       + spark_ribbon.css
├── arc_slip/            ArcSlip.js           + arc_slip.css
├── edge_divider/        EdgeDivider.js       + edge_divider.css
├── rune_title/          RuneTitle.js         + rune_title.css
├── core_avatar/         CoreAvatar.js        + core_avatar.css
└── edge_galtel/         EdgeGaltel.js        + edge_galtel.css

src/components/
├── arc_bento_header/            ArcBentoHeader.js     + arc_bento_header.css
├── arc_dialog/                  ArcDialog.js          + arc_dialog.css
├── arc_paper_board/             ArcPaperBoard.js      + arc_paper_board.css
├── arc_popup/                   ArcPopup.js           + arc_popup.css
├── arc_top_bar_parchment/       ArcTopBarParchment.js + arc_top_bar_parchment.css
└── arc_top_bar_compact/         ArcTopBarCompact.js   + arc_top_bar_compact.css
```

### Demo-страница
```
ui_kit.html          ← standalone HTML (корень проекта)
ui_kit_main.js       ← entry point
```

---

## Пример: ArcBentoHeader

```javascript
// src/components/arc_bento_header/ArcBentoHeader.js
import Component from '../../core/Component.js';
import CoreAvatar from '../ui_kit/core_avatar/CoreAvatar.js';
import FluxStatBar from '../ui_kit/flux_stat_bar/FluxStatBar.js';
import FluxSegmentBar from '../ui_kit/flux_segment_bar/FluxSegmentBar.js';
import EdgeGaltel from '../ui_kit/edge_galtel/EdgeGaltel.js';

export default class ArcBentoHeader extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    return `
      <div class="arc-bento-header">
        <div class="arc-bento-header__left arc-panel">
          <div id="bh-galtel-tr"></div>
          <div id="bh-galtel-bl"></div>
          <div class="arc-bento-header__avatar" id="bh-avatar"></div>
          <div class="arc-bento-header__stats" id="bh-stats">
            <div class="arc-bento-header__player-row">
              <span class="arc-bento-header__name">SIR GALAHAD</span>
              <div class="arc-bento-header__badges">
                <div class="arc-bento-header__badge"><i data-lucide="crown"></i></div>
                <div class="arc-bento-header__badge"><i data-lucide="gem"></i></div>
              </div>
            </div>
            <div id="bh-bars"></div>
          </div>
        </div>
        <div class="arc-bento-header__right arc-panel">
          <div id="bh-galtel-tl"></div>
          <div id="bh-galtel-br"></div>
          <div class="arc-bento-header__menu-btn">
            <i data-lucide="menu"></i>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    // Галтели — угловые маски
    await new EdgeGaltel({ position: 'top-right' }).render(this.$('#bh-galtel-tr'), 'innerHTML');
    await new EdgeGaltel({ position: 'bottom-left' }).render(this.$('#bh-galtel-bl'), 'innerHTML');
    await new EdgeGaltel({ position: 'top-left' }).render(this.$('#bh-galtel-tl'), 'innerHTML');
    await new EdgeGaltel({ position: 'bottom-right' }).render(this.$('#bh-galtel-br'), 'innerHTML');

    // Ядро — аватар
    this.avatar = new CoreAvatar({ level: 42 });
    await this.avatar.render(this.$('#bh-avatar'), 'innerHTML');

    // Flux — потоки энергии
    this.hpBar = new FluxStatBar({ label: 'HP', value: 3450, max: 4000, type: 'hp' });
    await this.hpBar.render(this.$('#bh-bars'), 'appendChild');

    this.mpBar = new FluxStatBar({ label: 'MP', value: 1200, max: 2500, type: 'mp' });
    await this.mpBar.render(this.$('#bh-bars'), 'appendChild');

    this.staminaBar = new FluxSegmentBar({ filled: 5, total: 8 });
    await this.staminaBar.render(this.$('#bh-bars'), 'appendChild');

    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  onDestroy() {
    this.avatar?.destroy();
    this.hpBar?.destroy();
    this.mpBar?.destroy();
    this.staminaBar?.destroy();
  }
}
```

---

## Порядок реализации

### Фаза 1: Фундамент
1. Дополнить `tokens.css` (Arc Design Tokens: `--core-crystal`, `--rust-bronze`, `--gilt-trim`, bar-цвета HP/MP/Stamina, dark-theme vars `--t-color-*` для blue/red/green)
2. Создать `ui_kit.html` + `ui_kit_main.js` (каркас + 12-theme switcher)

### Фаза 2: Атомарные (по зависимостям)
1. `EdgeDivider` + `RuneTitle` — простейшие, нужны всем секциям dashboard
2. `GlyphButton` — 5 вариантов (concave/convex/radial/pill/ingot)
3. `GlyphRunic` — 9 вариантов (3 стиля × 3 цвета)
4. `GlyphCombo` — 2 варианта (center/ltr)
5. `GlyphNav` — 12 вариантов (2 формы × 6 бордеров)
6. `SigilShield` + `SigilDiamond`
7. `FluxStatBar` + `FluxSegmentBar` + `FluxProgressBar`
8. `GearSlider` + `GearInput` + `GearDropdown`
9. `SparkRibbon` + `ArcSlip`
10. `CoreAvatar` + `EdgeGaltel`

### Фаза 3: Составные
1. `ArcBentoHeader`
2. `ArcDialog`
3. `ArcPaperBoard`
4. `ArcTopBarParchment` + `ArcTopBarCompact`
5. `ArcPopup`

### Фаза 4: Dashboard Assembly
1. Импортировать все в `ui_kit_main.js`
2. Рендерить по секциям
3. 12-theme switcher (3 dark + 9 MenuOverlay)
4. Финальная проверка

---

## Verification Plan

### Automated
- `http://localhost:6800/ui_kit.html` → визуальная проверка каждой секции
- Переключить все 12 тем → адаптация всех компонентов
- Lucide иконки отображаются корректно
- `http://localhost:6800/index.html` → основное приложение НЕ сломано

### Manual
- Скриншоты dashboard vs ref_15 / ref_17
- Каждый JS: `extends Component`, `template()`, `onMount()`, `onDestroy()`
- Каждый CSS: `display: grid`, CSS-переменные из tokens.css
- Каждый составной: импортирует и монтирует атомарные через `render()`
