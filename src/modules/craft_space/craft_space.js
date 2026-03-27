// Craft Space KanBan Board Logic

const COLUMNS = ['GET', 'DO', 'VERIFY', 'DONE'];

let rawTasks = [];
let tickets = [];
let draggedTicketId = null; // Failsafe global variable specifically for Drag and Drop

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
                    <h3>TASKS (MD)</h3>
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
                // Match headers e.g. "### TRENDING CREATORS"
                if (trimmed.startsWith('### ')) {
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
    } catch (e) {
        console.error("Failed to load CraftSpace data", e);
    }
}

function renderSidebar() {
    const list = document.getElementById('mdTasksList');
    if (!list) return;
    
    list.innerHTML = rawTasks.map(item => {
        if (item.type === 'chapter') {
            return `
                <div class="raw-task-chapter">
                    <span class="chapter-title">${item.text}</span>
                    <div class="chapter-line"></div>
                </div>
            `;
        } else {
            return `
                <div class="raw-task-item ${item.isDone ? 'done' : ''}">
                    <div class="raw-check">${item.isDone ? '✓' : ''}</div>
                    <span>${item.text}</span>
                </div>
            `;
        }
    }).join('');
}

function renderBoard() {
    COLUMNS.forEach(col => {
        const colContainer = document.getElementById(`col-${col}`);
        if (!colContainer) return;
        
        colContainer.innerHTML = '';
        const colTickets = tickets.filter(t => t.status === col);
        
        colTickets.forEach(ticket => {
            colContainer.appendChild(createTicketNode(ticket));
        });
    });
}

function createTicketNode(ticket) {
    // Create a ticket DOM node
    const card = document.createElement('div');
    // Make ticket draggable
    card.className = 'vintage-ticket';
    card.setAttribute('draggable', 'true');
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
        // Only allow drag if not expanded to prevent messy interactions
        if (isExpanded || isHovered) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        // Safari/Firefox sometimes demand ANY string to be explicitly set
        e.dataTransfer.setData('text/plain', String(ticket.id)); 
        
        // Critical: Store ID globally because "drop" event often loses this data in some browsers
        draggedTicketId = ticket.id;
        
        // Delay adding class so the drag-ghost doesn't immediately become transparent
        requestAnimationFrame(() => {
            card.classList.add('dragging');
        });
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedTicketId = null; // Clean up
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
                moveTicket(ticket.id, newStatus);
            }
        });
    });

    return card;
}

function moveTicket(id, newStatus) {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
        ticket.status = newStatus;
        localStorage.setItem('eatpan_tickets', JSON.stringify(tickets));
        renderBoard(); // Simple re-render to update DOM
    }
}
