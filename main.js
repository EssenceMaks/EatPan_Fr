import BookModule from './src/modules/recipe_book_sector/BookModule.js';
import { initCraftSpace } from './src/modules/craft_space/craft_space.js';

// --- ALL JS LOGIC FROM EatPan_SPA.html ---

const body = document.body;
const sectionBlocks = document.getElementById('sectionBlocks');
const smallClock = document.getElementById('smallClock');
const clockBlock = document.getElementById('clockBlock');
const bigClockFace = document.getElementById('bigClockFace');
const bigClockHand = document.getElementById('bigClockHand');
const bigTimeDisplay = document.getElementById('bigTimeDisplay');
const menuBtn = document.getElementById('menuBtn');
const backBtn = document.getElementById('backBtn');
const col3 = document.getElementById('col-3-container');
const col4 = document.getElementById('col-4-container');

let savedBlockIndex = 0;
const CLONES_COUNT = 2; 
let blockWidth = 0;     

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

// --- SEC: LOOPING ---
let isJumping = false;

function wrapToOriginalIfNeeded() {
    const centerX = sectionBlocks.scrollLeft + sectionBlocks.clientWidth / 2;
    const allBlocks = Array.from(sectionBlocks.querySelectorAll('.section_block:not(#clockBlock)'));
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
    if (body.classList.contains('active-mode') || blockWidth === 0 || isJumping) return;
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
    const centerX = sectionBlocks.scrollLeft + sectionBlocks.clientWidth / 2;
    const blocks = Array.from(sectionBlocks.querySelectorAll('.section_block:not(#clockBlock)'));
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
        blocks[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setTimeout(() => {
            isJumping = false;
            wrapToOriginalIfNeeded();
        }, 500);
    }
}

let wheelCooldown = false;
sectionBlocks.addEventListener('wheel', (evt) => {
    if (body.classList.contains('active-mode')) return;
    if (evt.deltaY !== 0) {
        evt.preventDefault();
        if (wheelCooldown) return;
        wheelCooldown = true;
        setTimeout(() => { wheelCooldown = false; }, 400);
        scrollToAdjacentBlock(evt.deltaY > 0 ? 1 : -1);
    }
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

function activateClock() {
    if (body.classList.contains('clock-mode')) return;
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

        if (nextState && nextState.type === 'block') {
            const block = document.querySelector(`.original-block[data-index="${nextState.index}"]`);
            if (block) block.classList.add('active'); 
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
            } else {
                ico.setAttribute('data-lucide', 'feather');
                txt.textContent = 'Створити рецепт';
            }
        }
        lucide.createIcons();
    }, 300);

    setTimeout(() => {
        pages.forEach(p => p.classList.remove('page--flipping'));
    }, 600);
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

window.saveRecipe = function() {
    console.log('Recipe saved (mock)');
    window.toggleCreateRecipe();
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
    
    // Inject the isolated Book Module into its block
    const cookbookArea = document.getElementById('cookbook-section');
    if (cookbookArea) {
        const bookModule = new BookModule();
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
    resetVisualState();

    if (state && state.type === 'block') {
        const block = document.querySelector(`.original-block[data-index="${state.index}"]`);
        if (block) performBlockActivation(block);
    } else {
        restoreScroll();
        moveElementWithAnimate(menuBtn, col4);
        setTimeout(() => { col4.insertBefore(menuBtn, backBtn); }, 400);
    }
});
