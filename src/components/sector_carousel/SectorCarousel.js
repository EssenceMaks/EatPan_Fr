/**
 * SectorCarousel — нескінченна прокрутка секторів
 * Відповідає за: infinite scroll, cloning, wheel/touch/keyboard,
 * block activation/deactivation, wedge blocks, history API
 *
 * Використовує display:flex для горизонтальної прокрутки (виняток із Grid-правила)
 */
import Component from '../../core/Component.js';
import RecipeBook from '../recipe_book/RecipeBook.js';
import TaskBoard from '../taskboard/TaskBoard.js';
import PantryStub from '../pantry_stub/PantryStub.js';
import ShoppingStub from '../shopping_stub/ShoppingStub.js';
import MealPlanStub from '../meal_plan_stub/MealPlanStub.js';
import SocialSector from '../social_sector/SocialSector.js';

// ============================================================
// SECTOR REGISTRY — easy to add/remove/reorder
// ============================================================
const SECTORS = [
  { id: 'hero',        title: 'Hero',         icon: 'swords',       subtitle: 'Your adventure starts here' },
  { id: 'dashboard',   title: 'My Dashboard', icon: 'layout-dashboard', subtitle: 'Overview' },
  { id: 'taskboard',   title: 'Taskboard',    icon: 'clipboard-list', subtitle: 'Plan & organize' },
  { id: 'kitchen',     title: 'My Kitchen',   icon: 'cooking-pot',  subtitle: 'Cooking workspace' },
  { id: 'recipe-book', title: 'Recipe Book',  icon: 'book-open',    subtitle: 'Collection of recipes' },
  { id: 'storage',     title: 'Storage',      icon: 'package-open', subtitle: 'Pantry / Larder / Cellar / Fridge' },
  { id: 'lists',       title: 'Lists',        icon: 'list-todo',    subtitle: 'Grocery List, Shop List' },
  { id: 'timeline',    title: 'Timeline',     icon: 'calendar-days', subtitle: 'Calendar & schedule' },
  { id: 'contacts',    title: 'Contacts',     icon: 'users',        subtitle: 'Friends & community' },
];

const WEDGES = [
  { id: 'clock-wedge',   icon: 'clock',   title: 'Clock' },
  { id: 'profile-wedge', icon: 'user',    title: 'Profile' },
  { id: 'auth-wedge',    icon: 'log-in',  title: 'Sign In' },
];

// ============================================================
// CONSTANTS
// ============================================================
const CLONES_COUNT = 2;
const BLOCK_NAV_SETTLE_MS = 520;
const BLOCK_NAV_TARGET_EPSILON = 6;
const WHEEL_INTENT_THRESHOLD = 32;
const WHEEL_INTENT_RESET_MS = 140;
const WHEEL_GESTURE_IDLE_MS = 180;
const WHEEL_GESTURE_KEEPALIVE_DELTA = 10;
const WHEEL_POST_NAV_LOCK_MS = 80;
const WHEEL_POST_FINALIZE_LOCK_MS = 160;

export default class SectorCarousel extends Component {
  constructor(props = {}) {
    super(props);
    // State
    this.savedBlockIndex = 0;
    this.blockWidth = 0;
    this.isJumping = false;
    this.pendingBlockNavTarget = null;
    this.blockNavFinalizeTimer = null;

    // Wheel state
    this.wheelGestureLocked = false;
    this.wheelGestureUnlockTimer = null;
    this.wheelIntentAccumulator = 0;
    this.wheelIntentAxis = null;
    this.wheelIntentResetTimer = null;
    this.wheelLockUntil = 0;

    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchDirection = null;

    // Wedge visibility
    this.clockWedgeVisible = false;
    this.profileWedgeVisible = false;
    this.authWedgeVisible = false;

    // Scroll debounce
    this._scrollDebounce = null;

    // Callbacks — set by AppShell
    this.onBlockActivated = props.onBlockActivated || (() => {});
    this.onBlockDeactivated = props.onBlockDeactivated || (() => {});
  }

  async template() {
    // Build wedge blocks BEFORE sectors
    const wedgesHTML = WEDGES.map(w => {
      let content = '';
      if (w.id === 'clock-wedge') {
        content = `
          <div class="section_block" id="clockBlock" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%;">
            <div class="big-clock-face" id="bigClockFace">
              <div class="clock-center-dot"></div>
              <div class="clock-hand" id="bigClockHand"></div>
            </div>
            <div class="selected-time-display" id="bigTimeDisplay">12:00</div>
          </div>
        `;
      }
      return `
      <div class="wedge-block" id="${w.id}">
        <div class="sector-preview">
          <i data-lucide="${w.icon}" style="width:48px;height:48px;opacity:0.7;"></i>
          <div class="sector-title">${w.title}</div>
        </div>
        <div class="sector-content" id="${w.id}-content">${content}</div>
      </div>
      `;
    }).join('');

    // Build sector cards
    const sectorsHTML = SECTORS.map((s, i) => `
      <div class="sector-card original-block" data-index="${i}" data-sector-id="${s.id}">
        <div class="sector-preview">
          <i data-lucide="${s.icon}" style="width:48px;height:48px;opacity:0.7;"></i>
          <div class="sector-title">${s.title}</div>
          <div class="sector-subtitle">${s.subtitle}</div>
        </div>
        <div class="sector-content">
          <div class="sector-content-header" style="display:grid; gap:8px;">
            <h2 style="font-family:var(--font-title);color:var(--text-accent);font-size:1.3rem;">${s.title}</h2>
            <div class="rpg-divider"></div>
          </div>
          <div class="sector-content-body" style="flex:1;display:grid;place-items:center;opacity:0.3;">
            <p style="font-family:var(--font-title);font-style:italic;">Content coming soon...</p>
          </div>
        </div>
      </div>
    `).join('');

    return `<div id="sector-carousel">${wedgesHTML}${sectorsHTML}</div>`;
  }

  async onMount() {
    this.carousel = this.element;

    if (window.lucide) lucide.createIcons({ root: this.element });

    // Mount complex blocks BEFORE infinite scroll cloning,
    // so clones also get the rendered content
    const originalRecipeBookContainer = this.carousel.querySelector('.original-block[data-sector-id="recipe-book"] .sector-content');
    if (originalRecipeBookContainer) {
      originalRecipeBookContainer.innerHTML = '';
      this.recipeBookComponent = new RecipeBook();
      await this.recipeBookComponent.render(originalRecipeBookContainer, 'innerHTML');
    }

    const originalTaskBoardContainer = this.carousel.querySelector('.original-block[data-sector-id="taskboard"] .sector-content');
    if (originalTaskBoardContainer) {
      originalTaskBoardContainer.innerHTML = '';
      this.taskBoardComponent = new TaskBoard();
      await this.taskBoardComponent.render(originalTaskBoardContainer, 'innerHTML');
    }

    // Phase 13: Mount stub components into sectors
    const storageContainer = this.carousel.querySelector('.original-block[data-sector-id="storage"] .sector-content');
    if (storageContainer) {
      storageContainer.innerHTML = '';
      this.pantryStub = new PantryStub();
      await this.pantryStub.render(storageContainer, 'innerHTML');
    }

    const listsContainer = this.carousel.querySelector('.original-block[data-sector-id="lists"] .sector-content');
    if (listsContainer) {
      listsContainer.innerHTML = '';
      this.shoppingStub = new ShoppingStub();
      await this.shoppingStub.render(listsContainer, 'innerHTML');
    }

    const kitchenContainer = this.carousel.querySelector('.original-block[data-sector-id="kitchen"] .sector-content');
    if (kitchenContainer) {
      kitchenContainer.innerHTML = '';
      this.mealPlanStub = new MealPlanStub();
      await this.mealPlanStub.render(kitchenContainer, 'innerHTML');
    }

    const contactsContainer = this.carousel.querySelector('.original-block[data-sector-id="contacts"] .sector-content');
    if (contactsContainer) {
      contactsContainer.innerHTML = '';
      this.socialSector = new SocialSector();
      await this.socialSector.render(contactsContainer, 'innerHTML');
    }

    // NOW init infinite scroll (clones will include mounted content)
    this._initInfiniteScroll();
    this._setupScrollListener();
    this._setupWheelListener();
    this._setupTouchListeners();
    this._setupClickListener();
    this._setupKeyboardListener();
    this._setupResizeListener();
    this._setupHistoryListener();
  }

  onDestroy() {
    clearTimeout(this._scrollDebounce);
    clearTimeout(this.blockNavFinalizeTimer);
    clearTimeout(this.wheelGestureUnlockTimer);
    clearTimeout(this.wheelIntentResetTimer);
  }

  // ============================================================
  // INFINITE SCROLL (CLONES)
  // ============================================================
  _initInfiniteScroll() {
    this.carousel.querySelectorAll('.clone-block').forEach(el => el.remove());
    const originals = Array.from(this.carousel.querySelectorAll('.original-block'));
    if (originals.length === 0) return;

    // Clone last N before originals
    for (let i = originals.length - 1; i >= Math.max(0, originals.length - CLONES_COUNT); i--) {
      const clone = originals[i].cloneNode(true);
      clone.classList.add('clone-block');
      clone.classList.remove('original-block');
      const first = this.carousel.querySelector('.original-block, .clone-block');
      this.carousel.insertBefore(clone, first);
    }

    // Clone first N after originals
    for (let i = 0; i < Math.min(CLONES_COUNT, originals.length); i++) {
      const clone = originals[i].cloneNode(true);
      clone.classList.add('clone-block');
      clone.classList.remove('original-block');
      this.carousel.appendChild(clone);
    }

    setTimeout(() => {
      this._updateBlockMetrics();
      this._jumpToOriginal(0, 'auto');
      requestAnimationFrame(() => this.carousel.classList.add('snapping'));
    }, 80);
  }

  _updateBlockMetrics() {
    const first = this.carousel.querySelector('.original-block');
    if (!first) return;
    const second = first.nextElementSibling;
    this.blockWidth = second
      ? second.offsetLeft - first.offsetLeft
      : first.offsetWidth + 20;
  }

  _jumpToOriginal(index, behavior = 'auto') {
    const target = this.carousel.querySelector(`.original-block[data-index="${index}"]`);
    if (target) {
      const scrollTarget = target.offsetLeft - (this.carousel.clientWidth / 2) + (target.clientWidth / 2);
      this.carousel.scrollTo({ left: scrollTarget, behavior });
    }
  }

  getCurrentBlockIndex() {
    const centerX = this.carousel.scrollLeft + this.carousel.clientWidth / 2;
    const originals = this.carousel.querySelectorAll('.original-block');
    let closestIdx = 0;
    let minDist = Infinity;
    originals.forEach(b => {
      const bCenter = b.offsetLeft + b.clientWidth / 2;
      const dist = Math.abs(bCenter - centerX);
      if (dist < minDist) { minDist = dist; closestIdx = parseInt(b.dataset.index); }
    });
    return closestIdx;
  }

  // ============================================================
  // LOOPING
  // ============================================================
  _wrapToOriginalIfNeeded() {
    const centerX = this.carousel.scrollLeft + this.carousel.clientWidth / 2;
    const allBlocks = Array.from(this.carousel.querySelectorAll('.sector-card:not(.wedge-block)'));
    let closest = null;
    let minDist = Infinity;
    allBlocks.forEach(b => {
      const dist = Math.abs((b.offsetLeft + b.clientWidth / 2) - centerX);
      if (dist < minDist) { minDist = dist; closest = b; }
    });
    if (closest && closest.classList.contains('clone-block')) {
      const dataIndex = parseInt(closest.dataset.index);
      this.carousel.classList.remove('snapping');
      this._jumpToOriginal(dataIndex, 'auto');
      requestAnimationFrame(() => this.carousel.classList.add('snapping'));
    }
  }

  // ============================================================
  // SCROLL LISTENER
  // ============================================================
  _setupScrollListener() {
    this.carousel.addEventListener('scroll', () => {
      if (document.body.classList.contains('active-mode') || this.blockWidth === 0) return;
      if (this.isJumping) {
        if (this.pendingBlockNavTarget !== null &&
            Math.abs(this.carousel.scrollLeft - this.pendingBlockNavTarget) <= BLOCK_NAV_TARGET_EPSILON) {
          this._finalizeBlockNavigation();
        }
        return;
      }
      clearTimeout(this._scrollDebounce);
      this._scrollDebounce = setTimeout(() => this._wrapToOriginalIfNeeded(), 150);
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================
  scrollToAdjacentBlock(direction) {
    if (this.isJumping) return;
    const centerX = this.carousel.scrollLeft + this.carousel.clientWidth / 2;
    const blocks = Array.from(this.carousel.querySelectorAll('.sector-card:not(.wedge-block):not([style*="display: none"])'));
    let currentIdx = 0;
    let minDist = Infinity;
    blocks.forEach((b, i) => {
      const dist = Math.abs((b.offsetLeft + b.clientWidth / 2) - centerX);
      if (dist < minDist) { minDist = dist; currentIdx = i; }
    });
    const nextIdx = currentIdx + direction;
    if (nextIdx >= 0 && nextIdx < blocks.length) {
      this.isJumping = true;
      this.carousel.classList.remove('snapping');
      this.pendingBlockNavTarget = this._scrollBlockToCenter(blocks[nextIdx], 'smooth');
      clearTimeout(this.blockNavFinalizeTimer);
      this.blockNavFinalizeTimer = setTimeout(() => this._finalizeBlockNavigation(), BLOCK_NAV_SETTLE_MS);
    }
  }

  _finalizeBlockNavigation() {
    clearTimeout(this.blockNavFinalizeTimer);
    this.blockNavFinalizeTimer = null;
    this.pendingBlockNavTarget = null;
    this.isJumping = false;
    this._resetWheelGestureState();
    this.wheelLockUntil = Date.now() + WHEEL_POST_FINALIZE_LOCK_MS;
    this._wrapToOriginalIfNeeded();
    requestAnimationFrame(() => this.carousel.classList.add('snapping'));
  }

  _scrollBlockToCenter(block, behavior = 'smooth') {
    if (!block) return null;
    const scrollTarget = block.offsetLeft - (this.carousel.clientWidth / 2) + (block.clientWidth / 2);
    this.carousel.scrollTo({ left: scrollTarget, behavior });
    return scrollTarget;
  }

  // ============================================================
  // WHEEL
  // ============================================================
  _resetWheelGestureState() {
    clearTimeout(this.wheelGestureUnlockTimer);
    this.wheelGestureUnlockTimer = null;
    this.wheelGestureLocked = false;
    this.wheelIntentAccumulator = 0;
    this.wheelIntentAxis = null;
  }

  _keepWheelGestureAlive(delta) {
    if (Math.abs(delta) < WHEEL_GESTURE_KEEPALIVE_DELTA) return;
    clearTimeout(this.wheelGestureUnlockTimer);
    this.wheelGestureUnlockTimer = setTimeout(() => this._resetWheelGestureState(), WHEEL_GESTURE_IDLE_MS);
  }

  _setupWheelListener() {
    this.carousel.addEventListener('wheel', (evt) => {
      if (document.body.classList.contains('active-mode')) return;
      evt.preventDefault();

      const absX = Math.abs(evt.deltaX);
      const absY = Math.abs(evt.deltaY);
      if (absX < 2 && absY < 2) return;

      const intent = absX > absY
        ? { axis: 'x', delta: evt.deltaX }
        : { axis: 'y', delta: evt.deltaY };

      this._keepWheelGestureAlive(intent.delta);

      if (!this.isJumping && this.wheelGestureLocked && Date.now() >= this.wheelLockUntil &&
          Math.abs(intent.delta) >= WHEEL_GESTURE_KEEPALIVE_DELTA) {
        this._resetWheelGestureState();
      }

      if (Date.now() < this.wheelLockUntil || this.isJumping || this.wheelGestureLocked) return;

      if (this.wheelIntentAxis && this.wheelIntentAxis !== intent.axis) this.wheelIntentAccumulator = 0;
      this.wheelIntentAxis = intent.axis;
      this.wheelIntentAccumulator += intent.delta;

      clearTimeout(this.wheelIntentResetTimer);
      this.wheelIntentResetTimer = setTimeout(() => {
        this.wheelIntentAccumulator = 0;
        this.wheelIntentAxis = null;
      }, WHEEL_INTENT_RESET_MS);

      if (Math.abs(this.wheelIntentAccumulator) < WHEEL_INTENT_THRESHOLD) return;

      const direction = this.wheelIntentAccumulator > 0 ? 1 : -1;
      this.wheelIntentAccumulator = 0;
      this.wheelIntentAxis = null;
      this.wheelGestureLocked = true;
      this.wheelLockUntil = Date.now() + WHEEL_POST_NAV_LOCK_MS;
      this.scrollToAdjacentBlock(direction);
    }, { passive: false });
  }

  // ============================================================
  // TOUCH
  // ============================================================
  _setupTouchListeners() {
    this.carousel.addEventListener('touchstart', (e) => {
      if (document.body.classList.contains('active-mode')) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchDirection = null;
    }, { passive: true });

    this.carousel.addEventListener('touchmove', (e) => {
      if (document.body.classList.contains('active-mode')) return;
      const dx = e.touches[0].clientX - this.touchStartX;
      const dy = e.touches[0].clientY - this.touchStartY;
      if (!this.touchDirection && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        this.touchDirection = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      }
      if (this.touchDirection === 'v') e.preventDefault();
    }, { passive: false });

    this.carousel.addEventListener('touchend', (e) => {
      if (document.body.classList.contains('active-mode') || this.touchDirection !== 'v') return;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      if (Math.abs(dy) > 30) this.scrollToAdjacentBlock(dy < 0 ? 1 : -1);
      this.touchDirection = null;
    }, { passive: true });
  }

  // ============================================================
  // CLICK → ACTIVATE
  // ============================================================
  _setupClickListener() {
    this.carousel.addEventListener('click', (e) => {
      const block = e.target.closest('.sector-card, .wedge-block');
      if (!block || block.classList.contains('wedge-block')) return;
      this._handleBlockClick(block);
    });
  }

  _handleBlockClick(element) {
    if (document.body.classList.contains('active-mode')) return;
    const containerCenter = this.carousel.scrollLeft + (this.carousel.clientWidth / 2);
    const elementCenter = element.offsetLeft + (element.clientWidth / 2);
    const diff = Math.abs(containerCenter - elementCenter);
    const threshold = element.offsetWidth / 3;

    if (diff > threshold) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      this.activateBlock(element);
    }
  }

  // ============================================================
  // BLOCK ACTIVATION / DEACTIVATION
  // ============================================================
  activateBlock(element) {
    this.savedBlockIndex = this.getCurrentBlockIndex();
    const index = element.dataset.index;

    if (history.state && history.state.type) {
      history.replaceState({ type: 'block', index }, null, '');
    } else {
      history.pushState({ type: 'block', index }, null, '');
    }
    this._performBlockActivation(element);
  }

  _performBlockActivation(element) {
    document.body.classList.add('active-mode');
    element.classList.add('active');
    element.scrollTop = 0;
    this.onBlockActivated(element);
  }

  deactivateAll() {
    this.visualDeactivate();
  }

  visualDeactivate() {
    document.body.classList.remove('active-mode', 'clock-mode');
    this.carousel.querySelectorAll('.sector-card.active, .wedge-block.active').forEach(b => b.classList.remove('active'));
    this._restoreScroll();
    this.onBlockDeactivated();
  }

  _restoreScroll() {
    this.carousel.classList.remove('snapping');
    this._jumpToOriginal(this.savedBlockIndex, 'auto');
    requestAnimationFrame(() => this.carousel.classList.add('snapping'));
  }

  // ============================================================
  // WEDGE TOGGLES
  // ============================================================
  toggleClockWedge() {
    const wedge = document.getElementById('clock-wedge');
    if (!wedge) return;

    if (document.body.classList.contains('active-mode') && !document.body.classList.contains('clock-mode')) {
      this.carousel.querySelectorAll('.sector-card.active').forEach(b => b.classList.remove('active'));
    }

    if (!this.clockWedgeVisible) {
      wedge.classList.add('visible');
      this.clockWedgeVisible = true;
    }

    if (!document.body.classList.contains('clock-mode')) {
      this.savedBlockIndex = this.getCurrentBlockIndex();
      history.pushState({ type: 'clock' }, null, '');
      document.body.classList.add('active-mode', 'clock-mode');
      wedge.classList.add('active');
      this.onBlockActivated(wedge);
    }
  }

  toggleProfileWedge() {
    const wedge = document.getElementById('profile-wedge');
    if (!wedge) return;
    if (!this.profileWedgeVisible) {
      wedge.classList.add('visible');
      this.profileWedgeVisible = true;
    }
    this.savedBlockIndex = this.getCurrentBlockIndex();
    history.pushState({ type: 'profile' }, null, '');
    document.body.classList.add('active-mode');
    wedge.classList.add('active');
    this.onBlockActivated(wedge);
  }

  toggleAuthWedge() {
    const wedge = document.getElementById('auth-wedge');
    if (!wedge) return;
    if (!this.authWedgeVisible) {
      wedge.classList.add('visible');
      this.authWedgeVisible = true;
    }
    this.savedBlockIndex = this.getCurrentBlockIndex();
    history.pushState({ type: 'auth' }, null, '');
    document.body.classList.add('active-mode');
    wedge.classList.add('active');
    this.onBlockActivated(wedge);
  }

  // ============================================================
  // KEYBOARD
  // ============================================================
  _setupKeyboardListener() {
    this._keyHandler = (event) => {
      if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'ArrowLeft') {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]')) return;
        
        if (document.body.classList.contains('active-mode') || document.body.classList.contains('clock-mode')) {
          event.preventDefault();
          history.back();
          return;
        }
        if (event.key === 'Escape' || event.key === 'Backspace') return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]')) return;
      if (document.body.classList.contains('active-mode') || document.body.classList.contains('clock-mode')) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault(); this.scrollToAdjacentBlock(1);
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault(); this.scrollToAdjacentBlock(-1);
      }
      if (event.key === 'Enter') {
        const idx = this.getCurrentBlockIndex();
        const block = this.carousel.querySelector(`.original-block[data-index="${idx}"]`);
        if (block) this.activateBlock(block);
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  // ============================================================
  // HISTORY (popstate)
  // ============================================================
  _setupHistoryListener() {
    this._popstateHandler = (e) => {
      const state = e.state;
      if (!state || !state.type) {
        this.deactivateAll();
        return;
      }

      // Sub-state routing optimization:
      // If the block is already active, don't perform the reset/reactivate logic here.
      // This allows sub-components to handle their own pushState/popState logic nicely.
      if (state.type === 'block') {
        const block = this.carousel.querySelector(`.original-block[data-index="${state.index}"]`);
        if (block && block.classList.contains('active')) {
          // Block is already active, ignore it so sub-components can handle their own popstate
          return;
        }
      }

      document.body.classList.remove('active-mode', 'clock-mode');
      this.carousel.querySelectorAll('.active').forEach(b => b.classList.remove('active'));

      if (state.type === 'block') {
        const block = this.carousel.querySelector(`.original-block[data-index="${state.index}"]`);
        if (block) this._performBlockActivation(block);
      } else if (state.type === 'clock') {
        const wedge = document.getElementById('clock-wedge');
        if (wedge) {
          document.body.classList.add('active-mode', 'clock-mode');
          wedge.classList.add('active');
          this.onBlockActivated(wedge);
        }
      } else if (state.type === 'profile') {
        const wedge = document.getElementById('profile-wedge');
        if (wedge) {
          document.body.classList.add('active-mode');
          wedge.classList.add('active');
          this.onBlockActivated(wedge);
        }
      } else if (state.type === 'auth') {
        const wedge = document.getElementById('auth-wedge');
        if (wedge) {
          document.body.classList.add('active-mode');
          wedge.classList.add('active');
          this.onBlockActivated(wedge);
        }
      }
    };
    window.addEventListener('popstate', this._popstateHandler);
  }

  // ============================================================
  // RESIZE
  // ============================================================
  _setupResizeListener() {
    this._resizeHandler = () => {
      clearTimeout(this._resizeDebounce);
      this._resizeDebounce = setTimeout(() => {
        if (!document.body.classList.contains('active-mode')) {
          this._updateBlockMetrics();
          this._jumpToOriginal(this.getCurrentBlockIndex(), 'auto');
        }
      }, 200);
    };
    window.addEventListener('resize', this._resizeHandler);
  }
}

export { SECTORS, WEDGES };
