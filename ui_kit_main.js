/**
 * ARC DESIGN SYSTEM — UI Kit Dashboard Entry Point
 * ALL 18 Atomic Components
 */

import EdgeDivider from './src/components/ui_kit/edge_divider/EdgeDivider.js';
import RuneTitle from './src/components/ui_kit/rune_title/RuneTitle.js';
import GlyphButton from './src/components/ui_kit/glyph_button/GlyphButton.js';
import GlyphRunic from './src/components/ui_kit/glyph_runic/GlyphRunic.js';
import GlyphCombo from './src/components/ui_kit/glyph_combo/GlyphCombo.js';
import GlyphNav from './src/components/ui_kit/glyph_nav/GlyphNav.js';
import SigilShield from './src/components/ui_kit/sigil_shield/SigilShield.js';
import SigilDiamond from './src/components/ui_kit/sigil_diamond/SigilDiamond.js';
import FluxStatBar from './src/components/ui_kit/flux_stat_bar/FluxStatBar.js';
import FluxSegmentBar from './src/components/ui_kit/flux_segment_bar/FluxSegmentBar.js';
import FluxProgressBar from './src/components/ui_kit/flux_progress_bar/FluxProgressBar.js';
import GearSlider from './src/components/ui_kit/gear_slider/GearSlider.js';
import GearInput from './src/components/ui_kit/gear_input/GearInput.js';
import GearDropdown from './src/components/ui_kit/gear_dropdown/GearDropdown.js';
import SparkRibbon from './src/components/ui_kit/spark_ribbon/SparkRibbon.js';
import ArcSlip from './src/components/ui_kit/arc_slip/ArcSlip.js';
import CoreAvatar from './src/components/ui_kit/core_avatar/CoreAvatar.js';
import EdgeGaltel from './src/components/ui_kit/edge_galtel/EdgeGaltel.js';

// =============================================
// Helper
// =============================================
function makeSection(container) {
  const el = document.createElement('div');
  el.className = 'arc-kit-section';
  container.appendChild(el);
  return el;
}

// =============================================
// SECTION 1: Decorative (EdgeDivider + RuneTitle)
// =============================================
async function renderDividers() {
  const container = document.getElementById('kit-section-dividers');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ДЕКОРАТИВНІ ЕЛЕМЕНТИ' }).render(sec, 'appendChild');
  await new EdgeDivider().render(sec, 'appendChild');
  await new RuneTitle({ text: 'ЗМЕНШЕНИЙ ЗАГОЛОВОК', size: 'sm' }).render(sec, 'appendChild');
  await new EdgeDivider().render(sec, 'appendChild');

  // EdgeGaltel variants
  await new RuneTitle({ text: 'ГАЛТЕЛІ (EDGE GALTEL)', size: 'sm' }).render(sec, 'appendChild');
  const galtelWrap = document.createElement('div');
  galtelWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px;';
  sec.appendChild(galtelWrap);
  await new EdgeGaltel({ variant: 'gold' }).render(galtelWrap, 'appendChild');
  await new EdgeGaltel({ variant: 'parchment' }).render(galtelWrap, 'appendChild');
  await new EdgeGaltel({ variant: 'theme' }).render(galtelWrap, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 2: GlyphButton (5 variants)
// =============================================
async function renderGlyphButtons() {
  const container = document.getElementById('kit-section-glyph-buttons');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ОБ\'ЄМНІ КНОПКИ (GLYPH)' }).render(sec, 'appendChild');

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex; flex-direction:column; gap:12px;';
  sec.appendChild(wrap);

  for (const v of [
    { variant: 'concave', label: 'УВІГНУТА (CONCAVE)' },
    { variant: 'convex', label: 'ОПУКЛА (CONVEX)' },
    { variant: 'radial', label: 'РАДІАЛЬНА (RADIAL)' },
    { variant: 'pill', label: 'КАПСУЛА (PILL)' },
    { variant: 'ingot', label: 'ЗЛИТОК (INGOT)' },
  ]) {
    await new GlyphButton(v).render(wrap, 'appendChild');
  }
  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 3: GlyphRunic (9 variants)
// =============================================
async function renderGlyphRunic() {
  const container = document.getElementById('kit-section-glyph-runic');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'РУНІЧНІ КНОПКИ (GLYPH RUNIC)' }).render(sec, 'appendChild');

  const shapes = ['single', 'dside', 'dfull'];
  const labels = { single: 'ОДИНАРНИЙ', dside: 'ПОДВІЙНИЙ БІЧНИЙ', dfull: 'ПОДВІЙНИЙ ПОВНИЙ' };

  for (const shape of shapes) {
    await new RuneTitle({ text: labels[shape], size: 'sm' }).render(sec, 'appendChild');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:10px;';
    sec.appendChild(row);
    for (const color of ['theme', 'brown', 'gold']) {
      await new GlyphRunic({ variant: shape, color, label: color.toUpperCase() }).render(row, 'appendChild');
    }
  }
  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 4: GlyphCombo (2 variants)
// =============================================
async function renderGlyphCombo() {
  const container = document.getElementById('kit-section-glyph-combo');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'СКЛАДЕНІ КНОПКИ (GLYPH COMBO)' }).render(sec, 'appendChild');
  await new GlyphCombo({ label: 'CENTER GRADIENT', icon: 'sword', variant: 'center' }).render(sec, 'appendChild');
  const sp1 = document.createElement('div'); sp1.style.height = '10px'; sec.appendChild(sp1);
  await new GlyphCombo({ label: 'LTR GRADIENT', icon: 'shield', variant: 'ltr' }).render(sec, 'appendChild');
  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 5: Sigils (Shield + Diamond)
// =============================================
async function renderSigils() {
  const container = document.getElementById('kit-section-sigils');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ЩИТИ ТА РОМБИ (SIGILS)' }).render(sec, 'appendChild');

  // Shields
  const shieldRow = document.createElement('div');
  shieldRow.style.cssText = 'display:flex; justify-content:space-around; align-items:center; padding:15px; background:rgba(0,0,0,0.4); border:1px solid var(--gold-dark); border-radius:8px; box-shadow:inset 0 0 20px rgba(0,0,0,0.8);';
  sec.appendChild(shieldRow);
  await new SigilShield({ icon: 'shield', variant: 'normal' }).render(shieldRow, 'appendChild');
  await new SigilShield({ icon: 'sword', variant: 'normal' }).render(shieldRow, 'appendChild');
  await new SigilShield({ icon: 'gem', variant: 'double' }).render(shieldRow, 'appendChild');
  await new SigilShield({ icon: 'crown', variant: 'double' }).render(shieldRow, 'appendChild');

  // Diamonds
  await new RuneTitle({ text: 'РОМБОПОДІБНІ ІКОНКИ', size: 'sm' }).render(sec, 'appendChild');
  const diamondRow = document.createElement('div');
  diamondRow.style.cssText = 'display:flex; justify-content:center; flex-wrap:wrap; gap:20px; padding:15px;';
  sec.appendChild(diamondRow);
  for (const [icon, variant] of [['gem','hollow'],['flame','hollow'],['zap','filled'],['heart','filled']]) {
    await new SigilDiamond({ icon, variant }).render(diamondRow, 'appendChild');
  }
  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 6: FluxStatBar + FluxSegmentBar
// =============================================
async function renderFluxBars() {
  const container = document.getElementById('kit-section-flux-bars');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'СТАТ БАРИ (FLUX STAT)' }).render(sec, 'appendChild');

  await new FluxStatBar({ label: 'ВИТРИВАЛІСТЬ', value: 80, max: 100, type: 'stamina' }).render(sec, 'appendChild');
  await new FluxStatBar({ label: 'ДОСВІД', value: 350, max: 1000, type: 'exp' }).render(sec, 'appendChild');
  await new FluxStatBar({ label: 'ЗДОРОВ\'Я', value: 65, max: 100, type: 'health' }).render(sec, 'appendChild');
  await new FluxStatBar({ label: 'МАНА', value: 40, max: 100, type: 'mana' }).render(sec, 'appendChild');

  // Segment bars
  await new RuneTitle({ text: 'СЕГМЕНТИ (FLUX SEGMENT)', size: 'sm' }).render(sec, 'appendChild');
  await new FluxSegmentBar({ total: 10, filled: 7, variant: 'gold' }).render(sec, 'appendChild');
  const sp = document.createElement('div'); sp.style.height = '6px'; sec.appendChild(sp);
  await new FluxSegmentBar({ total: 10, filled: 4, variant: 'theme' }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 7: FluxProgressBar (4 fill variants)
// =============================================
async function renderFluxProgress() {
  const container = document.getElementById('kit-section-flux-progress');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ПРОГРЕС БАРИ (FLUX)' }).render(sec, 'appendChild');

  for (const v of [
    { variant: 'solid', label: 'SOLID FILL', value: 70 },
    { variant: 'seg', label: 'SEGMENTED', value: 55 },
    { variant: 'pill', label: 'PILL FILL', value: 80 },
    { variant: 'theme', label: 'THEME COLOR', value: 65 },
  ]) {
    await new FluxProgressBar(v).render(sec, 'appendChild');
  }
  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 8: Gear (Slider + Input + Dropdown)
// =============================================
async function renderGear() {
  const container = document.getElementById('kit-section-gear');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ЕЛЕМЕНТИ ВВОДУ (GEAR)' }).render(sec, 'appendChild');

  // Sliders
  for (const v of [
    { variant: 'classic', label: 'CLASSIC SLIDER', value: 60 },
    { variant: 'diamond-thin', label: 'DIAMOND THIN', value: 40 },
    { variant: 'hex', label: 'HEX SLIDER', value: 75 },
    { variant: 'hex-diamond', label: 'HEX-DIAMOND', value: 50 },
    { variant: 'theme', label: 'THEME SLIDER', value: 70 },
  ]) {
    await new GearSlider(v).render(sec, 'appendChild');
  }

  // Input
  await new RuneTitle({ text: 'ПОЛЕ ВВОДУ', size: 'sm' }).render(sec, 'appendChild');
  await new GearInput({ placeholder: 'Введіть ім\'я героя...' }).render(sec, 'appendChild');
  const sp = document.createElement('div'); sp.style.height = '8px'; sec.appendChild(sp);

  // Dropdown
  await new RuneTitle({ text: 'ВИПАДНИЙ СПИСОК', size: 'sm' }).render(sec, 'appendChild');
  await new GearDropdown({ placeholder: 'Обрати клас...', options: ['Воїн', 'Маг', 'Розбійник', 'Лучник'] }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 9: SparkRibbon (6 combinations)
// =============================================
async function renderSparkRibbons() {
  const container = document.getElementById('kit-section-spark');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'СПОВІЩЕННЯ (SPARK RIBBON)' }).render(sec, 'appendChild');

  await new SparkRibbon({ title: 'Завдання виконано!', desc: 'Отримано нагороду: 150 XP', type: 'success', clip: 'inward', dir: 'ltr', iconStyle: 'icon', icon: 'check' }).render(sec, 'appendChild');
  await new SparkRibbon({ title: 'Увага!', desc: 'Залишилось мало здоров\'я', type: 'warning', clip: 'outward', dir: 'ltr', iconStyle: 'seal', icon: 'alert-triangle' }).render(sec, 'appendChild');
  await new SparkRibbon({ title: 'Критична помилка', desc: 'Зв\'язок із сервером втрачено', type: 'error', clip: 'inward', dir: 'ltr', iconStyle: 'square-seal', icon: 'x' }).render(sec, 'appendChild');

  await new RuneTitle({ text: 'RTL ВАРІАНТИ', size: 'sm' }).render(sec, 'appendChild');
  await new SparkRibbon({ title: 'Quest Complete!', desc: 'Reward: 150 XP', type: 'success', clip: 'inward', dir: 'rtl', iconStyle: 'icon', icon: 'check' }).render(sec, 'appendChild');
  await new SparkRibbon({ title: 'Warning!', desc: 'Low health', type: 'warning', clip: 'outward', dir: 'rtl', iconStyle: 'seal', icon: 'alert-triangle' }).render(sec, 'appendChild');
  await new SparkRibbon({ title: 'Critical Error', desc: 'Connection lost', type: 'error', clip: 'inward', dir: 'rtl', iconStyle: 'square-seal', icon: 'x' }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 10: ArcSlip (paper slips)
// =============================================
async function renderArcSlips() {
  const container = document.getElementById('kit-section-arc-slips');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ПАПЕРОВІ ЗАПИСИ (ARC SLIP)' }).render(sec, 'appendChild');

  // Board wrapper
  const board = document.createElement('div');
  board.style.cssText = 'background:#4a3525; background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px); border:3px solid #2a1b10; border-radius:6px; padding:12px; box-shadow:inset 0 0 30px rgba(0,0,0,0.9),0 5px 15px rgba(0,0,0,0.8); display:flex; flex-direction:column; gap:10px;';
  sec.appendChild(board);

  await new ArcSlip({ text: 'Замовлення на м\'ясо свині', icon: 'scroll', showSeal: true }).render(board, 'appendChild');
  await new ArcSlip({ text: 'Рецепт зілля мани', icon: 'flame', showSeal: true }).render(board, 'appendChild');
  await new ArcSlip({ text: 'Лист від коваля', icon: 'mail', showSeal: false }).render(board, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 11: CoreAvatar
// =============================================
async function renderCoreAvatars() {
  const container = document.getElementById('kit-section-core-avatar');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'АВАТАРИ (CORE AVATAR)' }).render(sec, 'appendChild');

  const row = document.createElement('div');
  row.style.cssText = 'display:flex; justify-content:center; gap:15px; align-items:end;';
  sec.appendChild(row);

  await new CoreAvatar({ icon: 'user', size: 'sm' }).render(row, 'appendChild');
  await new CoreAvatar({ icon: 'user', size: 'md' }).render(row, 'appendChild');
  await new CoreAvatar({ icon: 'user', size: 'lg' }).render(row, 'appendChild');
  await new CoreAvatar({ icon: 'crown', size: 'md', rounded: true }).render(row, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 12: GlyphNav
// =============================================
async function renderGlyphNav() {
  const container = document.getElementById('kit-section-glyph-nav');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'НАВІГАЦІЯ (GLYPH NAV)' }).render(sec, 'appendChild');

  await new GlyphNav({
    items: [
      { icon: 'home', label: 'Дім', active: true },
      { icon: 'map', label: 'Карта' },
      { icon: 'backpack', label: 'Сумка' },
      { icon: 'user', label: 'Герой' },
      { icon: 'settings', label: 'Налашт.' },
    ]
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================================
// COMPOSITE COMPONENTS (6 total)
// =============================================================
import ArcBentoHeader from './src/components/arc_bento_header/ArcBentoHeader.js';
import ArcTopBarParchment from './src/components/arc_topbar_parchment/ArcTopBarParchment.js';
import ArcTopBarCompact from './src/components/arc_topbar_compact/ArcTopBarCompact.js';
import ArcDialog from './src/components/arc_dialog/ArcDialog.js';
import ArcPaperBoard from './src/components/arc_paper_board/ArcPaperBoard.js';
import ArcPopup from './src/components/arc_popup/ArcPopup.js';
import ArcBentoHeaderFull from './src/components/arc_bento_header_full/ArcBentoHeaderFull.js';

// =============================================
// SECTION 13: ArcBentoHeader
// =============================================
async function renderBentoHeader() {
  const container = document.getElementById('kit-section-bento-header');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'BENTO ХЕДЕР (ARC BENTO HEADER)' }).render(sec, 'appendChild');

  await new ArcBentoHeader({
    name: 'SIR GALAHAD',
    hp: { value: 3450, max: 4000 },
    mp: { value: 1200, max: 2500 },
    stamina: { filled: 5, total: 8 },
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 14: ArcTopBarParchment
// =============================================
async function renderTopBarParchment() {
  const container = document.getElementById('kit-section-topbar-parchment');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ВЕРХНЯ ПАНЕЛЬ ПЕРГАМЕНТ (ARC TOPBAR)' }).render(sec, 'appendChild');

  await new ArcTopBarParchment({
    name: 'IRON CHEF',
    stamina: { value: 80, max: 100 },
    exp: { value: 350, max: 1000 },
    gold: 1250,
    gems: 50,
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 15: ArcTopBarCompact
// =============================================
async function renderTopBarCompact() {
  const container = document.getElementById('kit-section-topbar-compact');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ВЕРХНЯ ПАНЕЛЬ КОМПАКТ (ARC TOPBAR V2)' }).render(sec, 'appendChild');

  await new ArcTopBarCompact({
    name: 'DARK KNIGHT',
    level: 42,
    lvlPct: 70,
    gold: 1250,
    gems: 50,
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 16: ArcDialog
// =============================================
async function renderDialog() {
  const container = document.getElementById('kit-section-dialog');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ПЕРГАМЕНТНИЙ ДІАЛОГ (ARC DIALOG)' }).render(sec, 'appendChild');

  await new ArcDialog({
    title: 'ДОРУЧЕННЯ ВІД КОРОЛЯ',
    text: 'Мандрівнику, твоя допомога потрібна. Дракони нападають на село. Вирушиш ти на битву?',
    buttons: [
      { label: 'ПРИЙНЯТИ ЗАВДАННЯ', variant: 'concave' },
      { label: 'ВІДХИЛИТИ', variant: 'convex' },
    ]
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 17: ArcPaperBoard
// =============================================
async function renderPaperBoard() {
  const container = document.getElementById('kit-section-paper-board');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ДОШКА ОГОЛОШЕНЬ (ARC PAPER BOARD)' }).render(sec, 'appendChild');

  await new ArcPaperBoard({
    slips: [
      { text: 'Полювання на кабана — 50 золотих', icon: 'scroll', showSeal: true },
      { text: 'Рецепт зілля зцілення', icon: 'flame', showSeal: true },
      { text: 'Лист з гільдії ковалів', icon: 'mail', showSeal: false },
      { text: 'Карта підземелья — СЕКРЕТНО', icon: 'map', showSeal: true },
    ]
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 18: ArcPopup
// =============================================
async function renderPopup() {
  const container = document.getElementById('kit-section-popup');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ВСПЛИВАЮЧЕ ВІКНО (ARC POPUP)' }).render(sec, 'appendChild');

  await new ArcPopup({
    title: 'Підтвердження покупки',
    body: 'Придбати Меч Вогню за 500 золотих?',
    buttons: [
      { label: 'ПРИДБАТИ', variant: 'concave' },
      { label: 'СКАСУВАТИ', variant: 'convex' },
    ]
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// SECTION 19: ArcBentoHeaderFull (exact user_ref_v3)
// =============================================
async function renderBentoHeaderFull() {
  const container = document.getElementById('kit-section-bento-header-full');
  if (!container) return;
  const sec = makeSection(container);

  await new RuneTitle({ text: 'ПОВНИЙ BENTO ХЕДЕР (USER REF V3)' }).render(sec, 'appendChild');

  await new ArcBentoHeaderFull({
    name: 'SIR GALAHAD',
    level: 42,
    hp: { value: 3450, max: 4000 },
    mp: { value: 1200, max: 2500 },
    stamina: { filled: 5, total: 8 },
  }).render(sec, 'appendChild');

  await new EdgeDivider().render(sec, 'appendChild');
}

// =============================================
// INIT — All 18 Atomic + 7 Composite Components
// =============================================
async function init() {
  // Atomic (18)
  await renderDividers();
  await renderGlyphButtons();
  await renderGlyphRunic();
  await renderGlyphCombo();
  await renderSigils();
  await renderFluxBars();
  await renderFluxProgress();
  await renderGear();
  await renderSparkRibbons();
  await renderArcSlips();
  await renderCoreAvatars();
  await renderGlyphNav();

  // Composite (6)
  await renderBentoHeader();
  await renderTopBarParchment();
  await renderTopBarCompact();
  await renderDialog();
  await renderPaperBoard();
  await renderPopup();
  await renderBentoHeaderFull();

  // Initialize all Lucide icons globally
  if (window.lucide) lucide.createIcons();
}

init();

