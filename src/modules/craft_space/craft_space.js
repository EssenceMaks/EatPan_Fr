// Craft Space KanBan Board Logic

const COLUMNS = ['GET', 'DO', 'VERIFY', 'DONE'];

let rawTasks = [];
let tickets = [];
let draggedTicketId = null; // Failsafe global variable specifically for Drag and Drop

// Sidebar persistent state for tracking Markdown mappings
let sidebarState = {
    showArchive: false,
    showKanban: true,
    archivedTasks: [],
    linkedTickets: {},
    completedTasks: [] // Add client-side completed tracking
};

function saveSidebarState() {
    localStorage.setItem('eatpan_sidebar', JSON.stringify(sidebarState));
}

// Entry point when Craft Space block is loaded
export async function initCraftSpace(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Apply CSS constraints safely directly to this DOM node
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Render HTML structure
    container.innerHTML = `
        <div class="kanban-scroll-wrapper">
            <div class="kanban-board-container" id="kanbanBoardContainer">
                <div class="raw-tasks-sidebar">
                    <div class="sidebar-header-row">
                        <h3>TASKS (MD)</h3>
                        <div class="sidebar-toggles"></div>
                    </div>
                    <div id="mdTasksList">Loading...</div>
                </div>
                <!-- Kanban columns sit right next to sidebar -->
                ${COLUMNS.map(col => `
                    <div class="kanban-column" data-status="${col}">
                        <div class="kanban-column-header">${col}</div>
                        <div class="kanban-cards-container" id="col-${col}"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    await loadData();
    renderSidebar();
    renderBoard();

    // 1. Horizontal Scroll Wheel Translation (Smart Mode)
    const scrollWrapper = document.querySelector('.kanban-scroll-wrapper');
    if (scrollWrapper) {
        scrollWrapper.addEventListener('wheel', (evt) => {
            // Check if we are hovering over an element that SHOULD scroll vertically
            const path = evt.composedPath();
            const cardsContainer = path.find(el => el.classList && el.classList.contains('kanban-cards-container'));
            const mdList = document.querySelector('#mdTasksList');
            
            if (cardsContainer || (mdList && path.includes(mdList))) {
                const targetScrollContainer = cardsContainer || mdList;
                const canScrollVertically = targetScrollContainer.scrollHeight > targetScrollContainer.clientHeight;
                if (canScrollVertically && evt.deltaY !== 0) {
                    return; // exit our hijacker, let it scroll down!
                }
            }

            // If it's pure vertical scroll wheel, translate to horizontal
            if (evt.deltaY !== 0 && Math.abs(evt.deltaX) < Math.abs(evt.deltaY)) {
                evt.preventDefault();
                scrollWrapper.scrollLeft += evt.deltaY;
            }
        }, { passive: false });
    }

    // 2. Initialize Column Drop Zones
    const domColumns = container.querySelectorAll('.kanban-column');
    domColumns.forEach(col => {
        col.addEventListener('dragenter', e => {
            e.preventDefault();
            col.classList.add('drag-over');
        });

        col.addEventListener('dragover', e => {
            e.preventDefault(); // Must prevent default to allow dropping!
        });
        
        col.addEventListener('dragleave', e => {
            // Prevent flickering when moving over child elements
            if (!col.contains(e.relatedTarget)) {
                col.classList.remove('drag-over');
            }
        });
        
        col.addEventListener('drop', e => {
            e.preventDefault();
            col.classList.remove('drag-over');
            
            if(!draggedTicketId) return; // Retrieve from global JS memory!
            
            const newStatus = col.dataset.status;
            const ticket = tickets.find(t => String(t.id) === String(draggedTicketId));
            
            if (ticket && ticket.status !== newStatus) {
                ticket.status = newStatus;
                localStorage.setItem('eatpan_tickets', JSON.stringify(tickets));
                // We re-render the whole board cleanly to place the ticket in its new column
                renderBoard(); 
            }
            draggedTicketId = null; // Reset
        });
    });

    console.log("Craft Space logic fully initialized.");
}

async function loadData() {
    try {
        // Load MD tasks (with chapters)
        const mdRes = await fetch('./docs/tasks.md');
        if (mdRes.ok) {
            const mdText = await mdRes.text();
            rawTasks = mdText.split('\n').reduce((acc, line) => {
                const trimmed = line.trim();
                // Match subheaders e.g. "#### Frontend"
                if (trimmed.startsWith('#### ')) {
                    acc.push({ type: 'subchapter', text: trimmed.replace(/^####\s+/, '') });
                }
                // Match headers e.g. "### TRENDING CREATORS"
                else if (trimmed.startsWith('### ')) {
                    acc.push({ type: 'chapter', text: trimmed.replace(/^###\s+/, '') });
                } 
                // Match tasks
                else if (trimmed.startsWith('- [')) {
                    const isDone = trimmed.includes('- [x]') || trimmed.includes('- [X]');
                    const text = trimmed.replace(/- \[[ xX]\] /, '').trim();
                    acc.push({ type: 'task', text, isDone });
                }
                return acc;
            }, []);
        }

        // Load Tickets from localStorage OR fallback to JSON
        const storedTickets = localStorage.getItem('eatpan_tickets');
        if (storedTickets) {
            tickets = JSON.parse(storedTickets);
        } else {
            const diffRes = await fetch('./src/api/tickets.json');
            if (diffRes.ok) {
                tickets = await diffRes.json();
            }
        }

        // Load Sidebar Mappings state
        const storedSidebar = localStorage.getItem('eatpan_sidebar');
        if (storedSidebar) {
            sidebarState = { ...sidebarState, ...JSON.parse(storedSidebar) };
        }
    } catch (e) {
        console.error("Failed to load CraftSpace data", e);
    }
}

function renderSidebar() {
    // 1. Inject Toggles into Headers (across all SPA clones)
    const sidebars = document.querySelectorAll('.raw-tasks-sidebar');
    sidebars.forEach(sidebar => {
        let toggleContainer = sidebar.querySelector('.sidebar-toggles');
        if (!toggleContainer) return; // Structural HTML is generated in initCraftSpace
        
        toggleContainer.innerHTML = `
            <button class="btn-sidebar-toggle ${sidebarState.showArchive ? 'active' : ''}" id="toggleArchiveGlob" title="Показувати/Приховувати Архів">
                <i data-lucide="${sidebarState.showArchive ? 'eye' : 'eye-off'}" style="width:14px; height:14px;"></i> <span style="font-size: 10px; font-weight: bold; margin-left: 2px;">A</span>
            </button>
            <button class="btn-sidebar-toggle ${sidebarState.showKanban ? 'active' : ''}" id="toggleKanbanGlob" title="Показувати Значки Канбану">
                <i data-lucide="${sidebarState.showKanban ? 'eye' : 'eye-off'}" style="width:14px; height:14px;"></i> <span style="font-size: 10px; font-weight: bold; margin-left: 2px;">KB</span>
            </button>
        `;
        
        // Bind Header Events
        toggleContainer.querySelector('#toggleArchiveGlob').addEventListener('click', () => {
            sidebarState.showArchive = !sidebarState.showArchive;
            saveSidebarState();
            renderSidebar();
        });
        toggleContainer.querySelector('#toggleKanbanGlob').addEventListener('click', () => {
            sidebarState.showKanban = !sidebarState.showKanban;
            saveSidebarState();
            renderSidebar();
        });
    });

    // 2. Render List contents
    const lists = document.querySelectorAll('#mdTasksList');
    if (lists.length === 0) return;
    
    const htmlToInject = rawTasks.map((item, index) => {
        if (item.type === 'chapter') {
            return `
                <div class="raw-task-chapter">
                    <span class="chapter-title">${item.text}</span>
                    <div class="chapter-line"></div>
                </div>
            `;
        } else if (item.type === 'subchapter') {
            return `
                <div class="raw-task-subchapter">
                    <span class="subchapter-title">${item.text}</span>
                </div>
            `;
        } else if (item.type === 'task') {
            const isArchived = sidebarState.archivedTasks.includes(item.text);
            const isClientDone = sidebarState.completedTasks?.includes(item.text) || item.isDone;
            const linkedId = sidebarState.linkedTickets[item.text];
            const isLinked = !!linkedId;
            
            // Filter Logic:
            // If the user turned OFF showArchive...
            // AND the task IS archived...
            // AND the task is COMPLETED... then hide it!
            // BUT if it's archived and NOT completed, we still show it (greyed out).
            if (isArchived && isClientDone && !sidebarState.showArchive) return '';
            
            const archClass = isArchived ? 'archived' : '';
            let iconsHtml = '';
            
            // Archive Toggle Button
            iconsHtml += `
                <button class="sidebar-icon-btn btn-archive" data-idx="${index}" title="${isArchived ? 'Повернути з архіву' : 'В архів'}">
                    <i data-lucide="${isArchived ? 'archive-restore' : 'archive'}" style="width:14px; height:14px;"></i>
                </button>
            `;
            
            // Kanban Badge Button
            if (sidebarState.showKanban) {
                iconsHtml += `
                    <button class="sidebar-icon-btn btn-kanban ${isLinked ? 'linked' : ''}" data-idx="${index}" title="${isLinked ? 'Показати картку' : 'Створити картку на канбані'}">
                        <i data-lucide="${isLinked ? 'kanban' : 'plus-square'}" style="width:14px; height:14px;"></i>
                    </button>
                `;
            }

            return `
                <div class="raw-task-item ${isClientDone ? 'done' : ''} ${archClass}">
                    <div class="raw-check" data-idx="${index}" style="cursor: pointer;">
                        ${isClientDone ? '<i data-lucide="check" style="width:12px; height:12px; stroke-width:3px;"></i>' : ''}
                    </div>
                    <span class="task-text">${item.text}</span>
                    <div class="task-actions">
                        ${iconsHtml}
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');

    // Inject and bind dynamic events
    lists.forEach(list => {
        list.innerHTML = htmlToInject;
        
        // Task Context Actions
        list.querySelectorAll('.raw-check').forEach(check => {
            check.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!sidebarState.completedTasks) sidebarState.completedTasks = [];
                const idx = Number(check.dataset.idx);
                const taskText = rawTasks[idx].text;
                
                if (sidebarState.completedTasks.includes(taskText)) {
                    sidebarState.completedTasks = sidebarState.completedTasks.filter(t => t !== taskText);
                } else {
                    sidebarState.completedTasks.push(taskText);
                }
                saveSidebarState();
                renderSidebar();
            });
        });

        list.querySelectorAll('.btn-archive').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = Number(btn.dataset.idx);
                const taskText = rawTasks[idx].text;
                
                if (sidebarState.archivedTasks.includes(taskText)) {
                    sidebarState.archivedTasks = sidebarState.archivedTasks.filter(t => t !== taskText);
                } else {
                    sidebarState.archivedTasks.push(taskText);
                }
                saveSidebarState();
                renderSidebar();
            });
        });

        list.querySelectorAll('.btn-kanban').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = Number(btn.dataset.idx);
                const taskText = rawTasks[idx].text;
                const existingId = sidebarState.linkedTickets[taskText];
                
                if (existingId) {
                    // Navigate to existing Kanban card via smooth scrolling
                    const cardNode = document.querySelector(`.original-block .vintage-ticket[data-id="${existingId}"]`);
                    if (cardNode) {
                        cardNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        cardNode.classList.remove('flash-highlight');
                        void cardNode.offsetWidth; // force reflow jump
                        cardNode.classList.add('flash-highlight');
                    } else {
                        alert('Ця картка не знайдена на дошці. (Можливо була видалена вручну)');
                    }
                } else {
                    // Custom Modal Slide-in
                    window.showCustomModal(`Створити нову картку в Kanban для задачі:<br/><br/><span style="font-family:var(--font-body); font-size: 0.9rem; color: var(--ink); opacity: 0.8;">"${taskText}"?</span>`, () => {
                        const newId = Date.now().toString();
                        const newTicket = {
                            id: newId,
                            title: taskText,
                            type: 'FEAT', // Default fallback
                            typeLabel: 'FEAT',
                            tags: [],
                            checkpoints: [],
                            status: 'GET',
                            cost: '-',
                            timeLabel: 'est',
                            timeline: { start: '00:00', end: '00:00', date: '-' }
                        };
                        tickets.push(newTicket);
                        localStorage.setItem('eatpan_tickets', JSON.stringify(tickets));
                        
                        sidebarState.linkedTickets[taskText] = newId;
                        saveSidebarState();
                        
                        // Render full updates
                        renderBoard();
                        renderSidebar();
                        
                        // Focus visually
                        setTimeout(() => {
                            const newCard = document.querySelector(`.original-block .vintage-ticket[data-id="${newId}"]`);
                            if (newCard) {
                                newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                newCard.classList.add('flash-highlight');
                            }
                        }, 100);
                    });
                }
            });
        });
    });
    
    // Mount Lucide Icons dynamically
    if (window.lucide) {
        lucide.createIcons();
    }
}

function renderBoard() {
    COLUMNS.forEach(col => {
        // Query all instances across original and SPA-cloned blocks
        const colContainers = document.querySelectorAll(`.kanban-column[data-status="${col}"] .kanban-cards-container`);
        if (colContainers.length === 0) return;
        
        const colTickets = tickets.filter(t => t.status === col);
        
        colContainers.forEach(container => {
            container.innerHTML = '';
            colTickets.forEach(ticket => {
                container.appendChild(createTicketNode(ticket));
            });
        });
    });
}

function createTicketNode(ticket) {
    // Create a ticket DOM node
    const card = document.createElement('div');
    card.className = 'vintage-ticket';
    card.draggable = true;
    card.dataset.id = ticket.id;

    // Calc progress
    const totalChecks = ticket.checkpoints.length;
    const doneChecks = ticket.checkpoints.filter(c => c.done).length;
    const progressPerc = totalChecks > 0 ? doneChecks / totalChecks : 0;
    
    // Create Progress Dashes HTML
    const dashCount = 20; // Visual dashes
    const activeDashes = Math.round(progressPerc * dashCount);
    let topProgressBarHTML = '';
    for(let i=0; i<dashCount; i++) {
        topProgressBarHTML += `<div class="progress-dash ${i < activeDashes ? 'active' : ''}"></div>`;
    }

    // Checkpoints HTML
    const checksHTML = ticket.checkpoints.map((check, index) => `
        <div class="checklist-item ${check.done ? 'done' : ''}" data-idx="${index}">
            <div class="check-circle ${check.done ? 'filled' : ''}"></div>
            <span>${check.label}</span>
        </div>
    `).join('');

    // Action Buttons HTML
    const buttonsHTML = COLUMNS.map(col => `
        <button class="btn-action ${ticket.status === col ? 'active' : ''}" data-status="${col}">
            ${col}
        </button>
    `).join('');

    card.innerHTML = `
        <div class="ticket-main">
            <div class="ticket-header">
                <h3 class="ticket-title">${ticket.title}</h3>
                <div class="ticket-avatar">JS</div>
            </div>
            
            <div class="ticket-bar-container top-bar">
                ${topProgressBarHTML}
            </div>

            <div class="ticket-compact-footer">
                <div class="ticket-badges">
                    <span class="ticket-badge badge-${ticket.type.toLowerCase()}">${ticket.typeLabel}</span>
                    <span class="ticket-id">#${ticket.id}</span>
                </div>
                <div class="ticket-actions">${buttonsHTML}</div>
            </div>

            <div class="ticket-details">
                <div class="ticket-info-row">
                    <div class="ticket-content-left">
                        <div class="ticket-checklist">
                            ${checksHTML}
                        </div>
                    </div>
                    <div class="ticket-content-right">
                        <!-- Horizontal Buttons! -->
                        <div class="ticket-actions">
                            ${buttonsHTML}
                        </div>
                        <div class="ticket-cost-box">
                            <div class="ticket-cost-value">${ticket.cost}</div>
                            <div class="ticket-cost-label">${ticket.timeLabel}</div>
                        </div>
                    </div>
                </div>

                <div class="ticket-timeline">
                    <div class="timeline-labels">
                        <div>
                            <span>${ticket.timeline.start}</span><br>
                            <span class="timeline-date">${ticket.timeline.date}</span>
                        </div>
                        <div style="text-align:right;">
                            <span>${ticket.timeline.end}</span><br>
                            <span class="timeline-date">${ticket.timeline.date}</span>
                        </div>
                    </div>
                    <div class="ticket-bar-container">
                        ${topProgressBarHTML} <!-- Reusing same bar for bottom visual -->
                    </div>
                </div>
            </div>

            <!-- Expanded Comments Section (opens on + ) -->
            <div class="ticket-expanded-section">
                <div class="ticket-comment-dummy">Описание задачи отсутствует. Добавьте детали реализации.</div>
                <div class="ticket-comment-input">
                    <input type="text" placeholder="Быстрый комментарий..." />
                    <button>→</button>
                </div>
            </div>

        </div>
        <div class="ticket-expand-btn">
            <div class="expand-icon-wrap">+</div>
        </div>
    `;

    // Interactivity logic
    let isExpanded = false;
    let isHovered = false;
    const details = card.querySelector('.ticket-details');
    const expandedSection = card.querySelector('.ticket-expanded-section');
    const expandBtn = card.querySelector('.ticket-expand-btn');
    const expandIcon = card.querySelector('.expand-icon-wrap');
    const topBar = card.querySelector('.top-bar');
    const compactFooter = card.querySelector('.ticket-compact-footer');

    const updateDisplay = () => {
        // If hovered OR explicitly expanded via plus button -> show details
        if (isHovered || isExpanded) {
            card.classList.add('hovered');
            details.classList.add('visible');
        } else {
            card.classList.remove('hovered');
            details.classList.remove('visible');
        }

        // Expanded section ONLY shows when plus button is checked
        if (isExpanded) {
            expandedSection.classList.add('visible');
            expandIcon.innerHTML = '−';
        } else {
            expandedSection.classList.remove('visible');
            expandIcon.innerHTML = '+';
        }
    };

    card.addEventListener('mouseenter', () => {
        isHovered = true;
        updateDisplay();
    });
    
    card.addEventListener('mouseleave', () => {
        isHovered = false;
        updateDisplay();
    });

    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isExpanded = !isExpanded;
        // Also force hover state true while expanded, so leaving mouse doesn't close details
        if (isExpanded) isHovered = true; 
        updateDisplay();
    });

    // Drag and Drop Logic for this card
    card.addEventListener('dragstart', (e) => {
        draggedTicketId = ticket.id;
        // REQUIRED: Must set data otherwise dragging cancels in some browsers
        e.dataTransfer.setData('text/plain', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Use timeout so styling triggers AFTER browser screenshot for drag-ghost
        setTimeout(() => {
            card.classList.add('dragging');
        }, 0);
    });

    card.addEventListener('dragend', () => {
        draggedTicketId = null;
        card.classList.remove('dragging');
    });

    // Handle checkmark toggles
    const checkItems = card.querySelectorAll('.checklist-item');
    checkItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = item.dataset.idx;
            // Toggle ticket.checkpoints[idx]
            ticket.checkpoints[idx].done = !ticket.checkpoints[idx].done;
            localStorage.setItem('eatpan_tickets', JSON.stringify(tickets));
            renderBoard(); // re-render board entirely to update state
        });
    });

    // Button clicks for moving ticket
    const buttons = card.querySelectorAll('.btn-action');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // crucial for touch devices and reliable clicking
            e.stopPropagation();
            const newStatus = btn.dataset.status;
            if (newStatus !== ticket.status) {
                // Instantly move and re-render the board for absolute consistency
                moveTicket(ticket.id, newStatus);
            }
        });
    });

    return card;
}

function moveTicket(id, newStatus) {
    // 1. Ensure type-safe matching by casting both to Strings
    const ticket = tickets.find(t => String(t.id) === String(id));
    
    if (ticket) {
        // 2. Update memory state
        ticket.status = newStatus;
        
        // 3. Sync to persistence
        localStorage.setItem('eatpan_tickets', JSON.stringify(tickets));
        
        // 4. Force robust visual update. Rebuilding preserves flex states perfectly.
        renderBoard();
    } else {
        console.warn(`Attempted to move ticket ${id} but it was not found.`);
    }
}
// Global Modal Slide-In Mechanic
window.showCustomModal = function(message, onConfirm) {
    let modal = document.getElementById('kanban-custom-modal');
    
    // Create base template if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'kanban-custom-modal';
        
        // Inline Vintage Styles for slide-up block
        Object.assign(modal.style, {
            position: 'fixed',
            bottom: '-200px', // start hidden
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--parchment, #Fdfbf5)', // Fallback included
            border: '2px solid var(--brand-red, #9E1010)',
            borderRadius: '12px 12px 0 0',
            padding: '24px 20px',
            boxShadow: '0 -5px 30px rgba(0,0,0,0.15)',
            zIndex: '9999',
            fontFamily: 'var(--font-title)',
            color: 'var(--ink, #1F1E1B)',
            transition: 'bottom 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // smooth bouncy slide
            width: '90%',
            maxWidth: '500px',
            textAlign: 'center'
        });
        
        modal.innerHTML = `
            <div id="kmodal-msg" style="margin-bottom: 24px; font-size: 1.1rem; line-height: 1.4;"></div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="kmodal-yes" style="padding: 10px 24px; background: var(--brand-red, #9E1010); color: var(--parchment, #Fdfbf5); border: none; border-radius: 6px; cursor: pointer; font-family: var(--font-title); font-size: 1rem; font-weight: bold; transition: opacity 0.2s;">Створити</button>
                <button id="kmodal-no" style="padding: 10px 24px; background: transparent; border: 2px solid var(--ink, #1F1E1B); color: var(--ink, #1F1E1B); border-radius: 6px; cursor: pointer; font-family: var(--font-title); font-size: 1rem; font-weight: bold; transition: opacity 0.2s;">Скасувати</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Apply message
    document.getElementById('kmodal-msg').innerHTML = message;
    const btnYes = document.getElementById('kmodal-yes');
    const btnNo = document.getElementById('kmodal-no');
    
    // Clear old listeners by cloning
    const newYes = btnYes.cloneNode(true);
    const newNo = btnNo.cloneNode(true);
    btnYes.parentNode.replaceChild(newYes, btnYes);
    btnNo.parentNode.replaceChild(newNo, btnNo);
    
    // Slide up
    requestAnimationFrame(() => {
        modal.style.bottom = '0px';
    });
    
    newYes.addEventListener('hover', () => newYes.style.opacity = '0.8');
    newNo.addEventListener('hover', () => newNo.style.opacity = '0.8');
    
    newYes.addEventListener('click', () => {
        modal.style.bottom = '-300px';
        if (onConfirm) onConfirm();
    });
    
    newNo.addEventListener('click', () => {
        modal.style.bottom = '-300px'; // slide out
    });
};
