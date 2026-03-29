import BookModule from './src/modules/recipe_book_sector/BookModule.js';
import { initCraftSpace } from './src/modules/craft_space/craft_space.js';
import HeaderAuthModule from './src/modules/header_auth/HeaderAuthModule.js';
import ProfileModule from './src/modules/profile/ProfileModule.js';
import { RecipeService } from './src/api/RecipeService.js';

// --- ALL JS LOGIC FROM EatPan_SPA.html ---

const body = document.body;
const sectionBlocks = document.getElementById('sectionBlocks');
const smallClock = document.getElementById('smallClock');
const clockBlock = document.getElementById('clockBlock');
const bigClockFace = document.getElementById('bigClockFace');
const bigClockHand = document.getElementById('bigClockHand');
const bigTimeDisplay = document.getElementById('bigTimeDisplay');
const profileBlock = document.getElementById('profileBlock');
const menuBtn = document.getElementById('menuBtn');
const backBtn = document.getElementById('backBtn');
const col3 = document.getElementById('col-3-container');
const col4 = document.getElementById('col-4-container');

let savedBlockIndex = 0;
const CLONES_COUNT = 2; 
let blockWidth = 0;
const BLOCK_NAV_SETTLE_MS = 520;
const BLOCK_NAV_TARGET_EPSILON = 6;
const WHEEL_INTENT_THRESHOLD = 32;
const WHEEL_INTENT_RESET_MS = 140;
const WHEEL_GESTURE_IDLE_MS = 180;
const WHEEL_GESTURE_KEEPALIVE_DELTA = 10;
const WHEEL_POST_NAV_LOCK_MS = 80;
const WHEEL_POST_FINALIZE_LOCK_MS = 160;

function initInfiniteScroll() {
    const originals = Array.from(document.querySelectorAll('.original-block'));
    document.querySelectorAll('.clone-block').forEach(el => el.remove());

    for (let i = originals.length - 1; i >= originals.length - CLONES_COUNT; i--) {
        const clone = originals[i].cloneNode(true);
        clone.classList.add('clone-block');
        clone.classList.remove('original-block');
        const firstVisible = sectionBlocks.querySelector('.original-block, .clone-block');
        sectionBlocks.insertBefore(clone, firstVisible);
    }

    for (let i = 0; i < CLONES_COUNT; i++) {
        const clone = originals[i].cloneNode(true);
        clone.classList.add('clone-block');
        clone.classList.remove('original-block');
        sectionBlocks.appendChild(clone);
    }
    
    setTimeout(() => {
        updateBlockMetrics();
        jumpToOriginal(0, 'auto');
        
        requestAnimationFrame(() => {
            sectionBlocks.classList.add('snapping');
        });
    }, 100);
}

function updateBlockMetrics() {
    const firstBlock = sectionBlocks.querySelector('.original-block');
    if (firstBlock) {
        const secondBlock = firstBlock.nextElementSibling;
        if (secondBlock) {
             blockWidth = secondBlock.offsetLeft - firstBlock.offsetLeft;
        } else {
             blockWidth = firstBlock.offsetWidth + 20; 
        }
    }
}

function jumpToOriginal(index, behavior = 'auto') {
    const target = document.querySelector(`.original-block[data-index="${index}"]`);
    if (target) {
        const scrollTarget = target.offsetLeft - (sectionBlocks.clientWidth / 2) + (target.clientWidth / 2);
        sectionBlocks.scrollTo({ left: scrollTarget, behavior: behavior });
    }
}

function getCurrentBlockIndex() {
    const centerX = sectionBlocks.scrollLeft + sectionBlocks.clientWidth / 2;
    const originals = document.querySelectorAll('.original-block');
    let closestIdx = 0;
    let minDist = Infinity;
    originals.forEach(b => {
        const bCenter = b.offsetLeft + b.clientWidth / 2;
        const dist = Math.abs(bCenter - centerX);
        if (dist < minDist) { minDist = dist; closestIdx = parseInt(b.dataset.index); }
    });
    return closestIdx;
}

function resolveStateTarget(state) {
    if (!state) return null;

    if (state.type === 'block') {
        return document.querySelector(`.original-block[data-index="${state.index}"]`);
    }

    if (state.type === 'profile') {
        return profileBlock;
    }

    return null;
}

// --- SEC: LOOPING ---
let isJumping = false;
let pendingBlockNavTarget = null;
let blockNavFinalizeTimer = null;

function wrapToOriginalIfNeeded() {
    const centerX = sectionBlocks.scrollLeft + sectionBlocks.clientWidth / 2;
    const allBlocks = Array.from(sectionBlocks.querySelectorAll('.section_block:not(#clockBlock):not(.section_block--utility-page)'));
    let closest = null;
    let minDist = Infinity;
    allBlocks.forEach(b => {
        const dist = Math.abs((b.offsetLeft + b.clientWidth / 2) - centerX);
        if (dist < minDist) { minDist = dist; closest = b; }
    });
    if (closest && closest.classList.contains('clone-block')) {
        const dataIndex = parseInt(closest.dataset.index);
        sectionBlocks.classList.remove('snapping');
        jumpToOriginal(dataIndex, 'auto');
        requestAnimationFrame(() => sectionBlocks.classList.add('snapping'));
    }
}

let scrollDebounce = null;
sectionBlocks.addEventListener('scroll', () => {
    if (body.classList.contains('active-mode') || blockWidth === 0) return;
    if (isJumping) {
        if (pendingBlockNavTarget !== null && Math.abs(sectionBlocks.scrollLeft - pendingBlockNavTarget) <= BLOCK_NAV_TARGET_EPSILON) {
            finalizeBlockNavigation();
        }
        return;
    }
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(wrapToOriginalIfNeeded, 150);
});

// --- SEC: CLOCKS ---
const DEG_PER_HOUR = 15;

function hourToAngle(h, m) {
    return (((h - 12 + 24) % 24) * DEG_PER_HOUR + (m || 0) * 0.25) % 360;
}

function angleToTime(deg) {
    deg = ((deg % 360) + 360) % 360;
    const totalMinutes = deg * 4;
    let offsetHours = Math.floor(totalMinutes / 60);
    let minutes = Math.round((totalMinutes % 60) / 5) * 5;
    if (minutes >= 60) { minutes = 0; offsetHours++; }
    const hour = (offsetHours + 12) % 24;
    return { hour, minute: minutes };
}

function setClockTime(h, m) {
    const angle = hourToAngle(h, m);
    bigClockHand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    bigTimeDisplay.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function createClockFace() {
    bigClockFace.querySelectorAll('.tick, .clock-label').forEach(el => el.remove());

    for (let i = 0; i < 24; i++) {
        const tick = document.createElement('div');
        tick.className = 'tick';
        if (i % 6 === 0) tick.classList.add('hour-tick');
        tick.style.transform = `translateX(-50%) rotate(${i * DEG_PER_HOUR}deg)`;
        bigClockFace.appendChild(tick);
    }

    const labels = [
        { hour: 12, text: '12:00' },
        { hour: 18, text: '18:00' },
        { hour: 0,  text: '0:00' },
        { hour: 6,  text: '6:00' },
        { hour: 23, text: '23:00' }
    ];
    labels.forEach(({ hour, text }) => {
        const angleDeg = hourToAngle(hour, 0);
        const rad = (angleDeg - 90) * Math.PI / 180;
        const r = 54;
        const label = document.createElement('div');
        label.className = 'clock-label';
        label.style.left = (50 + r * Math.cos(rad)) + '%';
        label.style.top  = (50 + r * Math.sin(rad)) + '%';
        label.textContent = text;
        bigClockFace.appendChild(label);
    });

    bigClockFace.addEventListener('click', (e) => {
        const rect = bigClockFace.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) / (rect.width / 2);
        if (dist < 0.15) return;
        let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        const { hour, minute } = angleToTime(angle);
        setClockTime(hour, minute);
    });
}

function showCurrentTimeOnBigClock() {
    const now = new Date();
    setClockTime(now.getHours(), now.getMinutes());
}

function updateSmallClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    smallClock.textContent = `${hours}:${minutes}`;
}

// --- SEC: SCROLL & TOUCH ---
function scrollToAdjacentBlock(direction) {
    if (isJumping) return;
    const centerX = sectionBlocks.scrollLeft + sectionBlocks.clientWidth / 2;
    const blocks = Array.from(sectionBlocks.querySelectorAll('.section_block:not(#clockBlock):not(.section_block--utility-page)'));
    let currentIdx = 0;
    let minDist = Infinity;
    blocks.forEach((b, i) => {
        const bCenter = b.offsetLeft + b.clientWidth / 2;
        const dist = Math.abs(bCenter - centerX);
        if (dist < minDist) { minDist = dist; currentIdx = i; }
    });
    const nextIdx = currentIdx + direction;
    if (nextIdx >= 0 && nextIdx < blocks.length) {
        isJumping = true;
        sectionBlocks.classList.remove('snapping');
        pendingBlockNavTarget = scrollBlockToCenter(blocks[nextIdx], 'smooth');
        clearTimeout(blockNavFinalizeTimer);
        blockNavFinalizeTimer = setTimeout(() => {
            finalizeBlockNavigation();
        }, BLOCK_NAV_SETTLE_MS);
    }
}

function finalizeBlockNavigation() {
    clearTimeout(blockNavFinalizeTimer);
    blockNavFinalizeTimer = null;
    pendingBlockNavTarget = null;
    isJumping = false;
    resetWheelGestureState();
    wheelLockUntil = Date.now() + WHEEL_POST_FINALIZE_LOCK_MS;
    wrapToOriginalIfNeeded();
    requestAnimationFrame(() => {
        sectionBlocks.classList.add('snapping');
    });
}

function scrollBlockToCenter(block, behavior = 'smooth') {
    if (!block) return null;
    const scrollTarget = block.offsetLeft - (sectionBlocks.clientWidth / 2) + (block.clientWidth / 2);
    sectionBlocks.scrollTo({ left: scrollTarget, behavior });
    return scrollTarget;
}

let wheelGestureLocked = false;
let wheelGestureUnlockTimer = null;
let wheelIntentAccumulator = 0;
let wheelIntentAxis = null;
let wheelIntentResetTimer = null;
let wheelLockUntil = 0;

function resetWheelGestureState() {
    clearTimeout(wheelGestureUnlockTimer);
    wheelGestureUnlockTimer = null;
    wheelGestureLocked = false;
    wheelIntentAccumulator = 0;
    wheelIntentAxis = null;
}

function keepWheelGestureAlive(delta) {
    if (Math.abs(delta) < WHEEL_GESTURE_KEEPALIVE_DELTA) return;
    clearTimeout(wheelGestureUnlockTimer);
    wheelGestureUnlockTimer = setTimeout(() => {
        resetWheelGestureState();
    }, WHEEL_GESTURE_IDLE_MS);
}

function resolveWheelIntent(evt) {
    const absX = Math.abs(evt.deltaX);
    const absY = Math.abs(evt.deltaY);
    if (absX < 2 && absY < 2) return null;

    if (absX > absY) {
        return { axis: 'x', delta: evt.deltaX };
    }

    return { axis: 'y', delta: evt.deltaY };
}

sectionBlocks.addEventListener('wheel', (evt) => {
    if (body.classList.contains('active-mode')) return;

    evt.preventDefault();

    const intent = resolveWheelIntent(evt);

    if (!intent) return;

    keepWheelGestureAlive(intent.delta);

    if (!isJumping && wheelGestureLocked && Date.now() >= wheelLockUntil && Math.abs(intent.delta) >= WHEEL_GESTURE_KEEPALIVE_DELTA) {
        resetWheelGestureState();
    }

    if (Date.now() < wheelLockUntil || isJumping || wheelGestureLocked) return;

    if (wheelIntentAxis && wheelIntentAxis !== intent.axis) {
        wheelIntentAccumulator = 0;
    }

    wheelIntentAxis = intent.axis;
    wheelIntentAccumulator += intent.delta;

    clearTimeout(wheelIntentResetTimer);
    wheelIntentResetTimer = setTimeout(() => {
        wheelIntentAccumulator = 0;
        wheelIntentAxis = null;
    }, WHEEL_INTENT_RESET_MS);

    if (Math.abs(wheelIntentAccumulator) < WHEEL_INTENT_THRESHOLD) return;

    const direction = wheelIntentAccumulator > 0 ? 1 : -1;
    wheelIntentAccumulator = 0;
    wheelIntentAxis = null;
    wheelGestureLocked = true;
    wheelLockUntil = Date.now() + WHEEL_POST_NAV_LOCK_MS;

    scrollToAdjacentBlock(direction);
}, { passive: false });

let touchStartX = 0, touchStartY = 0, touchDirection = null;

sectionBlocks.addEventListener('touchstart', (e) => {
    if (body.classList.contains('active-mode')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDirection = null;
}, { passive: true });

sectionBlocks.addEventListener('touchmove', (e) => {
    if (body.classList.contains('active-mode')) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (!touchDirection && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        touchDirection = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
    }
    if (touchDirection === 'v') {
        e.preventDefault();
    }
}, { passive: false });

sectionBlocks.addEventListener('touchend', (e) => {
    if (body.classList.contains('active-mode') || touchDirection !== 'v') return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dy) > 30) {
        scrollToAdjacentBlock(dy < 0 ? 1 : -1);
    }
    touchDirection = null;
}, { passive: true });

function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function getCurrentOriginalBlock() {
    const currentIndex = getCurrentBlockIndex();
    return document.querySelector(`.original-block[data-index="${currentIndex}"]`);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const createModeBook = document.querySelector('.book-cover.book--create-mode');
        if (createModeBook) {
            event.preventDefault();
            window.toggleCreateRecipe();
            return;
        }

        if (body.classList.contains('active-mode') || body.classList.contains('clock-mode')) {
            event.preventDefault();
            history.back();
        }
        return;
    }

    if (isEditableTarget(event.target)) return;
    if (body.classList.contains('active-mode') || body.classList.contains('clock-mode')) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        scrollToAdjacentBlock(1);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        scrollToAdjacentBlock(-1);
    }

    if (event.key === 'Enter') {
        const currentBlock = getCurrentOriginalBlock();
        if (!currentBlock) return;
        event.preventDefault();
        activateBlock(currentBlock);
    }
});

// --- SEC: CLICKS & ACTIVATION ---
sectionBlocks.addEventListener('click', (e) => {
    const block = e.target.closest('.section_block');
    if (!block || block.id === 'clockBlock') return; 
    handleBlockClick(block);
});

function handleBlockClick(element) {
    if (body.classList.contains('active-mode')) return;

    const containerCenter = sectionBlocks.scrollLeft + (sectionBlocks.clientWidth / 2);
    const elementCenter = element.offsetLeft + (element.clientWidth / 2);
    const diff = Math.abs(containerCenter - elementCenter);
    const threshold = element.offsetWidth / 3; 

    if (diff > threshold) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
        activateBlock(element);
    }
}

function activateBlock(element) {
    window.headerAuthModule?.closePanel();
    savedBlockIndex = getCurrentBlockIndex();
    const index = element.dataset.index;
    if (history.state && history.state.type) {
        history.replaceState({ type: 'block', index: index }, null, "");
    } else {
        history.pushState({ type: 'block', index: index }, null, "");
    }
    performBlockActivation(element);
}

function performBlockActivation(element) {
    body.classList.add('active-mode');
    element.classList.add('active');
    element.scrollTop = 0;
    moveElementWithAnimate(menuBtn, col3);
}

function activateUtilityPage(type, element) {
    if (!element) return;

    window.headerAuthModule?.closePanel();

    if (body.classList.contains('clock-mode')) {
        history.pushState({ type }, null, '');
        deactivateClockWithAnimation({ type });
        return;
    }

    if (!body.classList.contains('active-mode')) {
        savedBlockIndex = getCurrentBlockIndex();
    }

    const currentActive = document.querySelector('.section_block.active');
    if (currentActive && currentActive !== element) {
        currentActive.classList.remove('active');
    }

    if (history.state && history.state.type) {
        history.replaceState({ type }, null, '');
    } else {
        history.pushState({ type }, null, '');
    }

    performBlockActivation(element);
}

window.openProfilePage = function() {
    activateUtilityPage('profile', profileBlock);
};

function activateClock() {
    if (body.classList.contains('clock-mode')) return;
    window.headerAuthModule?.closePanel();
    if (!body.classList.contains('active-mode')) {
        savedBlockIndex = getCurrentBlockIndex();
    }
    history.pushState({ type: 'clock' }, null, "");

    const smallRect = smallClock.getBoundingClientRect();
    const currentActive = document.querySelector('.section_block.active');
    if (currentActive) currentActive.classList.remove('active');

    body.classList.add('active-mode'); 
    body.classList.add('clock-mode');
    clockBlock.classList.add('active'); 
    showCurrentTimeOnBigClock();

    moveElementWithAnimate(menuBtn, col3);

    const bigRect = bigClockFace.getBoundingClientRect();
    const scaleX = smallRect.width / bigRect.width;
    const scaleY = smallRect.height / bigRect.height;
    const transX = smallRect.left + (smallRect.width/2) - (bigRect.left + bigRect.width/2);
    const transY = smallRect.top + (smallRect.height/2) - (bigRect.top + bigRect.height/2);

    bigClockFace.style.transition = 'none';
    bigClockFace.style.transform = `translate(${transX}px, ${transY}px) scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(() => {
        void bigClockFace.offsetWidth; 
        bigClockFace.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)';
        bigClockFace.style.transform = ''; 
    });
}

function deactivateClockWithAnimation(nextState) {
    const smallRect = smallClock.getBoundingClientRect();
    const bigRect = bigClockFace.getBoundingClientRect();
    const scaleX = smallRect.width / bigRect.width;
    const scaleY = smallRect.height / bigRect.height;
    const transX = smallRect.left + (smallRect.width/2) - (bigRect.left + bigRect.width/2);
    const transY = smallRect.top + (smallRect.height/2) - (bigRect.top + bigRect.height/2);

    bigClockFace.style.transition = 'transform 0.4s ease-in';
    bigClockFace.style.transform = `translate(${transX}px, ${transY}px) scale(${scaleX}, ${scaleY})`;
    clockBlock.style.opacity = '0'; 

    setTimeout(() => {
        body.classList.remove('clock-mode');
        clockBlock.classList.remove('active');
        clockBlock.style.opacity = ''; 
        bigClockFace.style.transform = '';

        const nextTarget = resolveStateTarget(nextState);

        if (nextTarget) {
            nextTarget.classList.add('active'); 
        } else {
            body.classList.remove('active-mode');
            restoreScroll();
            moveElementWithAnimate(menuBtn, col4);
            setTimeout(() => { col4.insertBefore(menuBtn, backBtn); }, 400);
        }
    }, 350);
}

function resetVisualState() {
    body.classList.remove('active-mode');
    body.classList.remove('clock-mode');
    document.querySelectorAll('.section_block.active').forEach(b => b.classList.remove('active'));
    bigClockFace.style.transform = '';
}

function restoreScroll() {
    sectionBlocks.classList.remove('snapping');
    jumpToOriginal(savedBlockIndex, 'auto');
    requestAnimationFrame(() => {
        sectionBlocks.classList.add('snapping');
    });
}

function moveElementWithAnimate(element, newParent) {
    const first = element.getBoundingClientRect();
    newParent.appendChild(element);
    const last = element.getBoundingClientRect();
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;

    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    element.classList.remove('animating');

    requestAnimationFrame(() => {
        void element.offsetWidth; 
        element.classList.add('animating');
        element.style.transform = ''; 
    });
}

// Global scope helpers for HTML onclick
window.goBack = () => history.back();
window.setChapter = function(chap) {
    document.querySelectorAll('.tab-btn--top').forEach(btn => {
        if (btn.id !== 'chap-all-icon') btn.classList.remove('active');
    });
    const btn = document.getElementById('chap-' + chap);
    if (btn) btn.classList.add('active');
    window.updateFilterIconState();
};
window.updateFilterIconState = function() {
    const icon = document.getElementById('chap-all-icon');
    const checkedFilter = document.querySelector('input[name="ing_filter"]:checked');
    if (icon && checkedFilter) {
        if (checkedFilter.value !== 'all') {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }
    }
};
window.openCategory = function(catId, event) {
    document.querySelectorAll('.side-tab--left').forEach(tab => tab.classList.remove('active'));
    const clickedTab = (event && event.currentTarget) ? event.currentTarget : null;
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
};

window.toggleEdit = function() {
    document.getElementById('edit-modal').classList.toggle('hidden');
};

window.toggleCreateRecipe = function() {
    const bookCover = document.querySelector('.book-cover');
    if (!bookCover) return;

    const pages = bookCover.querySelectorAll('.page');
    if (bookCover.querySelector('.page--flipping')) return;

    pages.forEach(p => p.classList.add('page--flipping'));

    setTimeout(() => {
        bookCover.classList.toggle('book--create-mode');
        const isCreate = bookCover.classList.contains('book--create-mode');
        const btn = bookCover.querySelector('.bookmark-btn');
        if (btn) {
            const ico = btn.querySelector('[data-lucide]');
            const txt = btn.querySelector('.bookmark-text');
            if (isCreate) {
                ico.setAttribute('data-lucide', 'arrow-left');
                txt.textContent = 'До рецептів';
                
                const saveBtn = document.getElementById('btn-save-recipe');
                if (saveBtn) {
                    saveBtn.innerHTML = window.currentEditingRecipeId 
                        ? '<i data-lucide="check" style="width:16px;"></i> Зберегти зміни' 
                        : '<i data-lucide="check" style="width:16px;"></i> Зберегти в книгу';
                }
            } else {
                ico.setAttribute('data-lucide', 'feather');
                txt.textContent = 'Створити рецепт';
                
                if (window.currentEditingRecipeId) {
                    window.currentEditingRecipeId = null;
                    const delBtn = document.getElementById('btn-delete-recipe');
                    if (delBtn) delBtn.style.display = 'none';
                    // Simple clear mapping
                    const titleEl = document.querySelector('.create-input-title');
                    if (titleEl) titleEl.value = '';
                }
            }
        }
        lucide.createIcons();
    }, 300);

    setTimeout(() => {
        pages.forEach(p => p.classList.remove('page--flipping'));
    }, 600);
};

window.openEditRecipe = function() {
    if (!window.globalActiveRecipe) {
        alert("Оберіть рецепт для редагування");
        return;
    }
    const r = window.globalActiveRecipe;
    const data = r.data || {};
    window.currentEditingRecipeId = r.id; 

    // Populate Fields
    document.querySelector('.create-input-title').value = data.title || '';
    document.querySelector('.create-input-subtitle').value = data.subtitle || '';
    const stats = document.querySelectorAll('.create-stats-row .create-stat-input input');
    if(stats[0]) stats[0].value = data.time_str || '';
    if(stats[1]) stats[1].value = data.portions_str || '';
    
    // Books Checkboxes (Groups)
    const books = data.books || [];
    const checklistItems = document.querySelectorAll('.create-checklist input[type="checkbox"]');
    checklistItems.forEach(cb => cb.checked = false);

    const checklistContainer = document.getElementById('create-group-checklist');
    const inputContainer = document.getElementById('new-group-container');
    
    books.forEach(bk => {
        const cb = document.querySelector(`.create-checklist input[type="checkbox"][value="${bk}"]`);
        if (cb) {
            cb.checked = true;
        } else if (checklistContainer) {
            const label = document.createElement('label');
            label.className = 'create-check-item';
            label.innerHTML = `<input type="checkbox" name="book" value="${bk}" checked> <span>${bk}</span>`;
            if (inputContainer) {
                checklistContainer.insertBefore(label, inputContainer);
            } else {
                checklistContainer.appendChild(label);
            }
        }
    });

    // Category
    const categoryName = data.category || '';
    let catFound = false;
    document.querySelectorAll('.create-category-grid .create-cat-btn').forEach(btn => {
        if (btn.innerText.trim().toLowerCase() === categoryName.toLowerCase()) {
            btn.classList.add('selected');
            catFound = true;
        } else {
            btn.classList.remove('selected');
        }
    });

    if (categoryName && !catFound) {
        const grid = document.querySelector('.create-category-grid');
        if (grid) {
            const btn = document.createElement('button');
            btn.className = 'create-cat-btn selected';
            btn.type = 'button';
            btn.onclick = function() { window.selectCategory(this); };
            const fallbackIcon = window.getMainGroupIconDef ? window.getMainGroupIconDef(categoryName) : 'utensils';
            btn.innerHTML = `<i data-lucide="${fallbackIcon}" style="width:18px;"></i><span>${categoryName}</span>`;
            grid.appendChild(btn);
        }
    }

    // Ingredients
    const ingList = document.getElementById('create-ingredients-list');
    if (ingList) {
        ingList.innerHTML = '';
        const ings = data.ingredients || [];
        ings.forEach(ing => {
            const row = document.createElement('div');
            row.className = 'create-ingredient-row';
            row.innerHTML = `
                <input type="text" class="create-ing-name" placeholder="Інгредієнт" value="${(ing.name||'').replace(/"/g, '&quot;')}">
                <input type="text" class="create-ing-amount" placeholder="К-сть" value="${(ing.amount||'').replace(/"/g, '&quot;')}">
                <button type="button" class="create-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
            `;
            ingList.appendChild(row);
        });
    }

    // Steps
    const stepList = document.getElementById('create-steps-list');
    if (stepList) {
        stepList.innerHTML = '';
        const steps = data.steps || [];
        steps.forEach((st, idx) => {
            const row = document.createElement('div');
            row.className = 'create-step-row';
            row.innerHTML = `
                <div class="create-step-num">${String(idx + 1).padStart(2, '0')}</div>
                <div class="create-step-fields">
                    <input type="text" placeholder="Назва кроку" value="${(st.title||'').replace(/"/g, '&quot;')}">
                    <textarea placeholder="Опис кроку..." rows="2">${(st.text||'').replace(/</g, '&lt;')}</textarea>
                </div>
                <button type="button" class="create-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
            `;
            stepList.appendChild(row);
        });
    }

    // Secret & Serving
    document.querySelector('.create-secret-textarea').value = data.secret || '';
    document.querySelector('.create-serving-textarea').value = data.serving || '';

    // Show delete button
    const delBtn = document.getElementById('btn-delete-recipe');
    if(delBtn) delBtn.style.display = 'flex';

    window.toggleCreateRecipe();
};

window.deleteActiveRecipe = async function() {
    if (!window.currentEditingRecipeId) return;
    if (!confirm("Ви впевнені, що хочете видалити цей рецепт? Дія незворотна.")) return;
    
    try {
        const success = await RecipeService.deleteRecipe(window.currentEditingRecipeId);
        if (success) {
            window.toggleCreateRecipe();
            if (window.activeBookModule) {
                window.globalActiveRecipe = null;
                await window.activeBookModule.loadData();
            }
        } else {
            alert('Помилка при видаленні рецепту.');
        }
    } catch (e) {
        console.error(e);
        alert('Помилка підключення.');
    }
};

// ==========================================
// GROUP MANAGEMENT
// ==========================================
window.renameRecipeGroup = async function(oldName) {
    if (['Особисті', 'Гості', 'Заклади'].includes(oldName)) {
        alert("Неможливо перейменувати базову групу.");
        return;
    }
    const newName = prompt(`Введіть нову назву для групи "${oldName}":`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    if (!window.activeBookModule || !window.activeBookModule.recipes) return;
    
    // Find all recipes with this group and update them
    const recipesToUpdate = window.activeBookModule.recipes.filter(r => r.data && r.data.books && r.data.books.includes(oldName));
    
    let updatedCount = 0;
    for (const r of recipesToUpdate) {
        const updatedBooks = r.data.books.map(b => b === oldName ? newName.trim() : b);
        r.data.books = updatedBooks;
        const success = await window.RecipeService.updateRecipe(r.id, r.data);
        if (success) updatedCount++;
    }
    
    alert(`Група "${oldName}" перейменована на "${newName}". Оновлено рецептів: ${updatedCount}`);
    
    // Refresh UI
    if (window.activeBookModule) {
        await window.activeBookModule.loadData();
    }
};

window.deleteRecipeGroup = async function(groupName) {
    if (['Особисті', 'Гості', 'Заклади'].includes(groupName)) {
        alert("Неможливо видалити базову групу.");
        return;
    }
    
    const confirmDeleteGroup = confirm(`Ви хочете ВИДАЛИТИ групу "${groupName}"?`);
    if (!confirmDeleteGroup) return;

    const confirmDeleteRecipes = confirm(`Бажаєте також НАЗАВЖДИ ВИДАЛИТИ всі рецепти, які належать лише до цієї групи?\n\n[OK] - Видалити рецепти\n[Скасувати] - Залишити рецепти (видалити лише групу)`);

    if (!window.activeBookModule || !window.activeBookModule.recipes) return;

    const recipesInGroup = window.activeBookModule.recipes.filter(r => r.data && r.data.books && r.data.books.includes(groupName));
    let affectedCount = 0;

    for (const r of recipesInGroup) {
        if (confirmDeleteRecipes) {
            // Delete the entire recipe
            const success = await window.RecipeService.deleteRecipe(r.id);
            if (success) affectedCount++;
        } else {
            // Just remove the group from the recipe
            r.data.books = r.data.books.filter(b => b !== groupName);
            // If it has no books left, maybe optionally add "Всі рецепти" or something
            if (r.data.books.length === 0) r.data.books.push("Всі рецепти");
            
            const success = await window.RecipeService.updateRecipe(r.id, r.data);
            if (success) affectedCount++;
        }
    }
    
    alert(`Дію виконано успішно. Оброблено рецептів: ${affectedCount}`);
    
    if (window.activeBookModule) {
        // Switch back to "all" if we were inside the deleted group
        if (window.activeBookModule.state.activeBook === groupName) {
            window.activeBookModule.state.activeBook = 'all';
        }
        await window.activeBookModule.loadData();
    }
};

window.addCustomGroupInline = function() {
    const input = document.getElementById('new-group-input');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    
    const checklist = document.getElementById('create-group-checklist');
    if (!checklist) return;
    
    // Check if already exists
    const existing = Array.from(checklist.querySelectorAll('input[type="checkbox"]')).map(cb => cb.value);
    if (existing.includes(name)) {
        alert("Така група вже існує");
        return;
    }

    const label = document.createElement('label');
    label.className = 'create-check-item';
    label.innerHTML = `<input type="checkbox" name="book" value="${name}" checked> <span>${name}</span>`;
    
    const container = document.getElementById('new-group-container');
    if (container) {
        checklist.insertBefore(label, container);
    } else {
        checklist.appendChild(label);
    }
    input.value = '';
};

window.addCustomGroup = function() {
    const name = prompt("Введіть назву нової групи рецептів:");
    if (!name || !name.trim()) return;
    
    const checklist = document.getElementById('create-group-checklist');
    if (!checklist) return;

    const label = document.createElement('label');
    label.className = 'create-check-item';
    label.innerHTML = `<input type="checkbox" name="book" value="${name.trim()}" checked> <span>${name.trim()}</span>`;
    
    // Insert before the last element if it's the plus button
    const btn = checklist.querySelector('button');
    if (btn) {
        checklist.insertBefore(label, btn);
    } else {
        checklist.appendChild(label);
    }
};

window.selectCategory = function(btn) {
    btn.classList.toggle('selected');
};

window.toggleIconPicker = function() {
    const picker = document.getElementById('create-icon-picker');
    if (picker) picker.classList.toggle('show');
};

window.pickCategoryIcon = function(btn) {
    document.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const iconName = btn.dataset.icon;
    const preview = document.getElementById('selected-cat-icon');
    if (preview) {
        preview.querySelector('[data-lucide]').setAttribute('data-lucide', iconName);
        preview.classList.add('has-icon');
        lucide.createIcons();
    }
};

window.addCustomCategory = function() {
    const nameInput = document.getElementById('new-category-name');
    const selectedIcon = document.querySelector('.icon-pick-btn.selected');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) return;
    const iconName = selectedIcon ? selectedIcon.dataset.icon : 'utensils';
    const grid = document.querySelector('.create-category-grid');
    if (!grid) return;

    const btn = document.createElement('button');
    btn.className = 'create-cat-btn selected';
    btn.type = 'button';
    btn.setAttribute('onclick', 'window.selectCategory(this)');
    btn.innerHTML = '<i data-lucide="' + iconName + '" style="width:18px;"></i><span>' + name + '</span>';
    grid.appendChild(btn);

    nameInput.value = '';
    document.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
    const preview = document.getElementById('selected-cat-icon');
    if (preview) {
        preview.querySelector('[data-lucide]').setAttribute('data-lucide', 'help-circle');
        preview.classList.remove('has-icon');
    }
    document.getElementById('create-icon-picker').classList.remove('show');
    lucide.createIcons();
};

window.addIngredientRow = function() {
    const list = document.getElementById('create-ingredients-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'create-ingredient-row';
    row.innerHTML = `
        <input type="text" class="create-ing-name" placeholder="Інгредієнт">
        <input type="text" class="create-ing-amount" placeholder="К-сть">
        <button type="button" class="create-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
    `;
    list.appendChild(row);
    lucide.createIcons();
};

window.addStepRow = function() {
    const list = document.getElementById('create-steps-list');
    if (!list) return;
    const count = list.children.length + 1;
    const row = document.createElement('div');
    row.className = 'create-step-row';
    row.innerHTML = `
        <div class="create-step-num">${String(count).padStart(2, '0')}</div>
        <div class="create-step-fields">
            <input type="text" placeholder="Назва кроку">
            <textarea placeholder="Опис кроку..." rows="2"></textarea>
        </div>
        <button type="button" class="create-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
    `;
    list.appendChild(row);
    lucide.createIcons();
};

window.saveRecipe = async function() {
    console.log('Gathering recipe data...');
    try {
        const title = document.querySelector('.create-input-title')?.value.trim() || 'Без назви';
        const subtitle = document.querySelector('.create-input-subtitle')?.value.trim() || '';
        const timeStr = document.querySelectorAll('.create-stats-row .create-stat-input input')[0]?.value.trim() || '';
        const portionsStr = document.querySelectorAll('.create-stats-row .create-stat-input input')[1]?.value.trim() || '';
        
        // Books (e.g. ['Всі рецепти', 'Особисті'])
        const checkedBooks = Array.from(document.querySelectorAll('.create-checklist input:checked')).map(cb => cb.parentElement.innerText.trim());
        
        // Category 
        const catBtn = document.querySelector('.create-category-grid .create-cat-btn.selected');
        const categoryValue = catBtn ? catBtn.innerText.trim() : 'Без категорії';

        // Ingredients
        const ingredients = [];
        document.querySelectorAll('.create-ingredient-row').forEach(row => {
            const name = row.querySelector('.create-ing-name')?.value.trim();
            const amount = row.querySelector('.create-ing-amount')?.value.trim();
            if(name) {
                ingredients.push({ name, amount });
            }
        });

        // Steps
        const steps = [];
        document.querySelectorAll('.create-step-row').forEach((row, i) => {
            const stepTitle = row.querySelector('.create-step-fields input')?.value.trim() || '';
            const stepText = row.querySelector('.create-step-fields textarea')?.value.trim() || '';
            if(stepTitle || stepText) {
                steps.push({ num: i + 1, title: stepTitle, text: stepText });
            }
        });

        const secret = document.querySelector('.create-secret-textarea')?.value.trim() || '';
        const serving = document.querySelector('.create-serving-textarea')?.value.trim() || '';

        const payload = {
            title,
            subtitle,
            time_str: timeStr,
            portions_str: portionsStr,
            books: checkedBooks,
            category: categoryValue,
            ingredients,
            steps,
            secret,
            serving
        };

        if (window.currentEditingRecipeId) {
            console.log('Sending Update:', payload);
            const result = await RecipeService.updateRecipe(window.currentEditingRecipeId, payload);
            if (result && !result.error) {
                console.log("Success! Recipe Updated", result);
                window.currentEditingRecipeId = null; // Clear
                window.toggleCreateRecipe(); // Close modal
                if (window.activeBookModule) {
                    window.globalActiveRecipe = { id: result.id, data: result.data }; // Update locally
                    await window.activeBookModule.loadData();
                }
            } else {
                alert('Помилка при оновленні рецепту. Сервер не повернув 200.');
            }
        } else {
            console.log('Sending Recipe:', payload);
            const result = await RecipeService.createRecipe(payload);
            
            if (result && !result.error && typeof result.id !== 'undefined') {
                console.log("Success! Recipe Created", result);
                window.toggleCreateRecipe(); // Close modal
                
                // Re-fetch data and re-render BookModule smoothly
                if (window.activeBookModule) {
                    await window.activeBookModule.loadData();
                } else {
                    window.location.reload();
                }
            } else {
                console.error('Failed response:', result);
                alert('Помилка при збереженні (сервер не відповів "201 Created"). Перевір консоль (F12).');
            }
        }

    } catch (e) {
        console.error('Error in saveRecipe:', e);
        alert('Помилка підключення до API.');
    }
};


// INIT
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main SPA Router Started.');
    setInterval(updateSmallClock, 1000);
    updateSmallClock();
    smallClock.addEventListener('click', activateClock);
    
    const placeholder = document.querySelector('.clock-placeholder');
    if (placeholder) {
        placeholder.addEventListener('click', () => {
            if (document.body.classList.contains('clock-mode')) {
                window.history.back();
            }
        });
    }

    createClockFace();

    const headerAuthMount = document.getElementById('headerAuthMount');
    if (headerAuthMount) {
        const headerAuthModule = new HeaderAuthModule();
        window.headerAuthModule = headerAuthModule;
        const headerAuthElement = await headerAuthModule.render();
        headerAuthMount.appendChild(headerAuthElement);
    }

    const profileArea = document.getElementById('profile-section');
    if (profileArea) {
        const profileModule = new ProfileModule({ user: window.headerAuthModule?.getProfileIdentity?.() || null });
        window.profileModule = profileModule;
        const profileElement = await profileModule.render();
        profileArea.appendChild(profileElement);
    }
    
    // Inject the isolated Book Module into its block
    const cookbookArea = document.getElementById('cookbook-section');
    if (cookbookArea) {
        const bookModule = new BookModule();
        window.activeBookModule = bookModule; // Store globally for reloads
        const bookElement = await bookModule.render();
        cookbookArea.appendChild(bookElement);
    }
    
    // Inject Craft Space
    await initCraftSpace('craftSpaceInner');
    
    lucide.createIcons();
    initInfiniteScroll();

    // Init radio filter listeners (from my_recipes.html)
    document.querySelectorAll('input[name="ing_filter"]').forEach(radio => {
        radio.addEventListener('change', window.updateFilterIconState);
    });
    window.updateFilterIconState();
});

window.addEventListener('popstate', (event) => {
    const state = event.state;
    if (body.classList.contains('clock-mode')) {
        deactivateClockWithAnimation(state);
        return; 
    }

    // Catch if a recipe is currently open and user hit "Back" (ONLY ON MOBILE OVERLAY).
    const activeRecipeRight = document.querySelector('.page--right.is-open');
    if (activeRecipeRight && window.innerWidth <= 1024) {
        if (typeof window.closeActiveRecipe === 'function') {
            window.closeActiveRecipe();
        }
        return;
    }

    resetVisualState();

    const nextTarget = resolveStateTarget(state);

    if (nextTarget) {
        performBlockActivation(nextTarget);
    } else {
        restoreScroll();
        moveElementWithAnimate(menuBtn, col4);
        setTimeout(() => { col4.insertBefore(menuBtn, backBtn); }, 400);
    }
});
