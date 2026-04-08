# UI Kit Dashboard — Implementation Plan v2.2 (Arcanumtech)

## Цель

Создать набор **атомарных UI-компонентов** в `src/components/ui_kit/`, используя дизайн-систему **Arcanumtech** — алхимия, механизмы, кристаллы. Атомарные компоненты = "кирпичики" для больших **составных компонентов** в `src/components/`. Демо-страница `ui_kit.html` — витрина всех элементов.

---

## Arcanumtech — Naming Convention

| Термин | Значение | Применение |
|---|---|---|
| **Bolt** | Действие, мелкий элемент | Кнопки, иконки, action-элементы |
| **Lens** | Прозрачность, стекло, визуал | Щиты, ромбы, визуальные бейджи |
| **Flux** | Энергия, поток | Бары прогресса, полосы HP/MP |
| **Edge** | Грани, рамки, углы | Разделители, галтели, бордеры |
| **Spark** | Вспышка, обратная связь | Уведомления, алерты |
| **Arca** | Контейнер, хранилище | Панели, попапы, свитки |
| **Core** | Центр, суть | Аватары, главные элементы |
| **Gear** | Настройки, сетка | Слайдеры, инпуты, дропдауны |
| **Void** | Пустое, выключенное | Disabled-состояния (CSS-классы) |

### CSS-класс prefix: `at-` (ArcanumTech)
```css
.at-bolt-concave { }     /* Кнопка впуклая */
.at-flux-bar { }          /* Полоса прогресса */
.at-spark-ribbon { }      /* Уведомление */
.at-edge-divider { }      /* Разделитель */
```

### JS-класс naming: `{Category}{Name}`
```javascript
BoltButton        // Кнопка
FluxStatBar       // Полоса прогресса
SparkRibbon       // Уведомление
CoreHexAvatar     // Аватар
```

---

## Theme Switcher — 12 тем

### Группа 1: Dark-Themed (из референсов — `--t-color-*`)
| # | Тема | `--t-color-glare` | `--t-color-bottom` |
|---|---|---|---|
| 1 | **Blue** | `#298d9e` | `#0d3644` |
| 2 | **Red** | `#d65656` | `#360808` |
| 3 | **Green** | `#70c456` | `#0f2908` |

### Группа 2: Из MenuOverlay (9 тем — уже в `themes.css`)
| # | Тема | Ключевой цвет |
|---|---|---|
| 4 | Fantasy (default) | `#c5a044` |
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

| # | Класс JS | Директория | CSS prefix | Из референса | Кол-во вариантов |
|---|---|---|---|---|---|
| 1 | **BoltButton** | `bolt_button/` | `.at-bolt-` | concave, convex, radial, pill, ingot | 5 |
| 2 | **BoltHex** | `bolt_hex/` | `.at-bolt-hex-` | single, double-side, double-full × 3 цвета (theme/brown/gold) | 9 |
| 3 | **BoltCombo** | `bolt_combo/` | `.at-bolt-combo-` | center-gradient, ltr-gradient | 2 |
| 4 | **BoltNav** | `bolt_nav/` | `.at-bolt-nav-` | circle/square × normal/double/convex/double-convex/convex-strong/double-convex-strong | 12 |
| 5 | **LensShield** | `lens_shield/` | `.at-lens-shield-` | normal, double-border | 2 |
| 6 | **LensDiamond** | `lens_diamond/` | `.at-lens-diamond-` | hollow, filled | 2 |
| 7 | **FluxStatBar** | `flux_stat_bar/` | `.at-flux-bar-` | parchment-style (stamina/exp), flared-style (HP/MP) | 2 стиля |
| 8 | **FluxSegmentBar** | `flux_segment_bar/` | `.at-flux-seg-` | stamina segments (filled/empty) | 1 |
| 9 | **FluxProgressHex** | `flux_progress_hex/` | `.at-flux-prog-` | solid, segmented, pill, theme-color | 4 |
| 10 | **GearSlider** | `gear_slider/` | `.at-gear-slider-` | default-orb, diamond-thin, hex, hex-diamond, theme-glow | 5 |
| 11 | **GearInput** | `gear_input/` | `.at-gear-input-` | text input | 1 |
| 12 | **GearDropdown** | `gear_dropdown/` | `.at-gear-dropdown-` | dropdown + list | 1 |
| 13 | **SparkRibbon** | `spark_ribbon/` | `.at-spark-ribbon-` | inward/outward × LTR/RTL × icon/seal/square-seal = success/warning/error | 6 |
| 14 | **ArcaPaperSlip** | `arca_paper_slip/` | `.at-arca-slip-` | with seal (color variants) | 1 |
| 15 | **EdgeDivider** | `edge_divider/` | `.at-edge-divider` | diamond icon center | 1 |
| 16 | **EdgeSectionTitle** | `edge_section_title/` | `.at-edge-title` | section heading | 1 |
| 17 | **CoreHexAvatar** | `core_hex_avatar/` | `.at-core-avatar-` | hex-outer → hex-gap → hex-avatar + level-ribbon | 1 |
| 18 | **EdgeGaltel** | `edge_galtel/` | `.at-edge-galtel-` | top-right, bottom-left, top-left, bottom-right | 4 позиции |

### Уровень 2: Составные (components/) — 6 компонентов

| # | Класс JS | Директория | Из атомарных | Роль |
|---|---|---|---|---|
| A | **BentoHeader** | `bento_header/` | CoreHexAvatar + FluxStatBar + FluxSegmentBar + EdgeGaltel + BoltNav | Flared Bento RPG Header |
| B | **ArcaDialog** | `arca_dialog/` | BoltButton + EdgeDivider + EdgeSectionTitle | Пергаментный диалог квестов (V1+V2) |
| C | **ArcaPaperBoard** | `arca_paper_board/` | ArcaPaperSlip × N + EdgeSectionTitle | Деревянная доска объявлений |
| D | **ArcaPopup** | `arca_popup/` | BoltButton + GearInput | Модальное окно подтверждения |
| E | **ArcaTopBarParchment** | `arca_top_bar_parchment/` | FluxStatBar × 2 + LensShield | Шапка профиля (пергамент) |
| F | **ArcaTopBarCompact** | `arca_top_bar_compact/` | FluxStatBar + LensShield | Компактная шапка V2 |

---

## Аудит: Все элементы из референсов

### ref_1 copy 15.html — ✅ всё покрыто
| Блок в HTML | Компонент | ✓ |
|---|---|---|
| Theme Switcher Panel | Dashboard-level (12 тем) | ✅ |
| Верхняя панель V1 (пергамент) | ArcaTopBarParchment | ✅ |
| Верхняя панель V2 (компакт) | ArcaTopBarCompact | ✅ |
| Впуклые/Выпуклые кнопки | BoltButton (concave/convex) | ✅ |
| Щиты/Экипировка (normal+double) | LensShield | ✅ |
| Диалог V1 (простой) | ArcaDialog | ✅ |
| Диалог V2 (квест + тезисы + контролы) | ArcaDialog | ✅ |
| Кнопка Radial (с ромбиками) | BoltButton (radial) | ✅ |
| Hex-кнопки (3 варианта × 3 цвета) | BoltHex | ✅ |
| Ромбовидные иконки (hollow/filled) | LensDiamond | ✅ |
| Пилюля + Слиток | BoltButton (pill/ingot) | ✅ |
| Составные кнопки (center/ltr) | BoltCombo | ✅ |
| Доска с бумажками | ArcaPaperBoard + ArcaPaperSlip | ✅ |
| Алерты LTR (3 варианта) | SparkRibbon | ✅ |
| Алерты RTL (3 варианта) | SparkRibbon | ✅ |
| Input field | GearInput | ✅ |
| Dropdown | GearDropdown | ✅ |
| Slider (default orb) | GearSlider | ✅ |
| Slider (diamond-thin/hex/hex-diamond/theme) | GearSlider | ✅ |
| Progress Bars (solid/seg/pill/theme) | FluxProgressHex | ✅ |
| Paper Scroll (Свиток) | ArcaDialog / ArcaPopup | ✅ |
| Popup Modal | ArcaPopup | ✅ |
| Nav Icons (12 вариаций) | BoltNav | ✅ |
| Divider | EdgeDivider | ✅ |
| Section Title | EdgeSectionTitle | ✅ |

### ref_1 copy 17.html — ✅ всё покрыто
| Дополнительный блок | Компонент | ✓ |
|---|---|---|
| Flared Bento Header (left panel) | BentoHeader | ✅ |
| Flared Bento Header (right panel + menu btn) | BentoHeader | ✅ |
| Галтели (4 corner masks) | EdgeGaltel | ✅ |
| Hex Avatar + Level Ribbon | CoreHexAvatar | ✅ |
| Player Name + Badge Icons | BentoHeader (встроено) | ✅ |
| Flared HP/MP Bars | FluxStatBar (flared variant) | ✅ |
| Segmented Stamina Bar | FluxSegmentBar | ✅ |
| Flared Menu Button | BoltNav (flared variant) | ✅ |

### user_ref_v3.html — ✅ всё покрыто
Полностью дублирует Bento Header из ref_17 (standalone-вариант).

---

## Файловая структура

```
src/components/ui_kit/
├── bolt_button/         BoltButton.js + bolt_button.css
├── bolt_hex/            BoltHex.js + bolt_hex.css
├── bolt_combo/          BoltCombo.js + bolt_combo.css
├── bolt_nav/            BoltNav.js + bolt_nav.css
├── lens_shield/         LensShield.js + lens_shield.css
├── lens_diamond/        LensDiamond.js + lens_diamond.css
├── flux_stat_bar/       FluxStatBar.js + flux_stat_bar.css
├── flux_segment_bar/    FluxSegmentBar.js + flux_segment_bar.css
├── flux_progress_hex/   FluxProgressHex.js + flux_progress_hex.css
├── gear_slider/         GearSlider.js + gear_slider.css
├── gear_input/          GearInput.js + gear_input.css
├── gear_dropdown/       GearDropdown.js + gear_dropdown.css
├── spark_ribbon/        SparkRibbon.js + spark_ribbon.css
├── arca_paper_slip/     ArcaPaperSlip.js + arca_paper_slip.css
├── edge_divider/        EdgeDivider.js + edge_divider.css
├── edge_section_title/  EdgeSectionTitle.js + edge_section_title.css
├── core_hex_avatar/     CoreHexAvatar.js + core_hex_avatar.css
└── edge_galtel/         EdgeGaltel.js + edge_galtel.css

src/components/
├── bento_header/            BentoHeader.js + bento_header.css
├── arca_dialog/             ArcaDialog.js + arca_dialog.css
├── arca_paper_board/        ArcaPaperBoard.js + arca_paper_board.css
├── arca_popup/              ArcaPopup.js + arca_popup.css
├── arca_top_bar_parchment/  ArcaTopBarParchment.js + arca_top_bar_parchment.css
└── arca_top_bar_compact/    ArcaTopBarCompact.js + arca_top_bar_compact.css
```

### Demo-страница (корень проекта)
```
ui_kit.html          ← standalone HTML
ui_kit_main.js       ← entry point, import + render всех компонентов
```

---

## Пример: BentoHeader с Arcanumtech нейминг

```javascript
// src/components/bento_header/BentoHeader.js
import Component from '../../core/Component.js';
import CoreHexAvatar from '../ui_kit/core_hex_avatar/CoreHexAvatar.js';
import FluxStatBar from '../ui_kit/flux_stat_bar/FluxStatBar.js';
import FluxSegmentBar from '../ui_kit/flux_segment_bar/FluxSegmentBar.js';
import EdgeGaltel from '../ui_kit/edge_galtel/EdgeGaltel.js';

export default class BentoHeader extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    return `
      <div class="at-bento-header">
        <div class="at-bento-header__left at-arca-panel">
          <div id="bh-galtel-tr"></div>
          <div id="bh-galtel-bl"></div>
          <div class="at-bento-header__avatar" id="bh-avatar"></div>
          <div class="at-bento-header__stats" id="bh-stats"></div>
        </div>
        <div class="at-bento-header__right at-arca-panel">
          <div id="bh-galtel-tl"></div>
          <div id="bh-galtel-br"></div>
          <div class="at-bento-header__menu-btn">
            <i data-lucide="menu"></i>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    // Гальтели
    await new EdgeGaltel({ position: 'top-right' }).render(this.$('#bh-galtel-tr'), 'innerHTML');
    await new EdgeGaltel({ position: 'bottom-left' }).render(this.$('#bh-galtel-bl'), 'innerHTML');
    await new EdgeGaltel({ position: 'top-left' }).render(this.$('#bh-galtel-tl'), 'innerHTML');
    await new EdgeGaltel({ position: 'bottom-right' }).render(this.$('#bh-galtel-br'), 'innerHTML');

    // Аватар
    this.avatar = new CoreHexAvatar({ level: 42 });
    await this.avatar.render(this.$('#bh-avatar'), 'innerHTML');

    // Бары
    this.hpBar = new FluxStatBar({ label: 'HP', value: 3450, max: 4000, type: 'hp' });
    await this.hpBar.render(this.$('#bh-stats'), 'appendChild');

    this.mpBar = new FluxStatBar({ label: 'MP', value: 1200, max: 2500, type: 'mp' });
    await this.mpBar.render(this.$('#bh-stats'), 'appendChild');

    this.staminaBar = new FluxSegmentBar({ filled: 5, total: 8 });
    await this.staminaBar.render(this.$('#bh-stats'), 'appendChild');

    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
```

---

## Порядок реализации

### Фаза 1: Фундамент
1. Добавить недостающие CSS-токены в `tokens.css` (Arcanumtech vars: `--core-hex`, `--rust-gold`, dark-theme vars `--t-color-*`, bar vars `--hp-top/bottom`, `--mp-top/bottom`, `--stamina-top/bottom`)
2. Создать `ui_kit.html` + `ui_kit_main.js` (каркас + 12-theme switcher)

### Фаза 2: Атомарные (по зависимостям)
1. `EdgeDivider` + `EdgeSectionTitle` (простейшие, нужны всем секциям dashboard)
2. `BoltButton` (5 вариантов)
3. `BoltHex` (9 вариантов)
4. `BoltCombo` (2 варианта)
5. `BoltNav` (12 вариантов)
6. `LensShield` + `LensDiamond`
7. `FluxStatBar` + `FluxSegmentBar` + `FluxProgressHex`
8. `GearSlider` + `GearInput` + `GearDropdown`
9. `SparkRibbon` + `ArcaPaperSlip`
10. `CoreHexAvatar` + `EdgeGaltel`

### Фаза 3: Составные
1. `BentoHeader`
2. `ArcaDialog`
3. `ArcaPaperBoard`
4. `ArcaTopBarParchment` + `ArcaTopBarCompact`
5. `ArcaPopup`

### Фаза 4: Dashboard Assembly
1. Импортировать все в `ui_kit_main.js`
2. Рендерить по секциям
3. 12-theme switcher
4. Финальная проверка

---

## Verification Plan

### Automated
- `http://localhost:6800/ui_kit.html` → визуальная проверка
- Переключить все 12 тем → адаптация компонентов
- Lucide иконки → `lucide.createIcons()`
- `http://localhost:6800/index.html` → основное приложение НЕ сломано

### Manual
- Скриншоты dashboard vs ref_15 / ref_17
- Каждый JS: `extends Component`, `template()`, `onMount()`, `onDestroy()`
- Каждый CSS: `display: grid`, CSS-переменные из tokens.css
- Каждый составной: импортирует и монтирует атомарные через `render()`
