import Component from '../../core/Component.js';
import { supabase } from '../../core/supabaseClient.js';
import { TaskService, ProfileService, resetCircuitBreaker, invalidateSessionCache } from '../../core/ApiClient.js';
import TimeList from './TimeList.js';
import QuestList from './QuestList.js';
import QuestSettings from './QuestSettings.js';
import EisenhowerPanel from './EisenhowerPanel.js';
import MiniCalendar from './MiniCalendar.js';

/**
 * TaskBoard (Quest Tracker Orchestrator)
 * Layout:
 *   TOP BAR: "Мої квести" | "Спільні квести" + [Створити групу]
 *   DAY TABS: Пн Вт Ср Чт Пт Сб Нд (inline, inside timeline header)
 *   BODY: Timeline | QuestList | RightPanel (Eisenhower ↔ QuestSettings)
 */
export default class TaskBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questsData: {},
      activeQuestId: null,
      questCounter: 1,
      userId: null,
      currentDate: new Date(),
      rightPanelMode: 'eisenhower',   // 'eisenhower' | 'details'
      activeTab: 'my',                // 'my' | 'shared'
    };
    this.timeList = null;
    this.questList = null;
    this.questSettings = null;
    this.eisenhowerPanel = null;
    this.miniCalendar = null;
    this.saveDebounce = null;
  }

  async onMount() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      this.state.userId = session.user.id;
      await this.loadState();
    }

    // Always init UI components (skeleton visible even without auth)
    this._initTopBar();
    this._initDayNav();
    await this.initTimeList();
    await this.initQuestList();
    await this.initRightPanel();
    
    if (this.state.userId) {
      this._initBlocksDragAndDrop();
      await this._loadLayoutOrder();
    }

    // BUG-1 fix: слушаем смену auth-состояния (логин/логаут)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;
      const oldUserId = this.state.userId;

      if (newUserId !== oldUserId) {
        this.state.userId = newUserId;
        invalidateSessionCache();
        resetCircuitBreaker();
        
        if ((oldUserId && !newUserId) || (!oldUserId && newUserId)) {
          console.log(`%c[TaskBoard] Auth transition → ${event}, full update!`, 'color:#4ade80');
          this.update();
        } else {
          await this.loadState();
          this._refreshAll();
          console.log(`%c[TaskBoard] Auth changed → ${event}, userId: ${newUserId || 'guest'}`, 'color:#4ade80');
        }
      }
    });

    this.authSubscription = authListener.subscription;
  }

  onDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // ============================================
  // DRAG AND DROP BLOCKS
  // ============================================
  _initBlocksDragAndDrop() {
    const container = this.$('#quests-container');
    if (!container) return;

    let draggedBlock = null;

    container.addEventListener('dragstart', (e) => {
      // Don't hijack task drag and drop
      if (e.target.closest('.tb-list-item') || e.target.closest('.task-item')) return;
      
      const block = e.target.closest('.tb-quest-block');
      if (block) {
        draggedBlock = block;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('block-drag', 'true');
        setTimeout(() => draggedBlock.classList.add('dragging-block'), 0);
      }
    });

    container.addEventListener('dragover', (e) => {
      if (!draggedBlock) return;
      e.preventDefault();
      const afterElement = this._getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggedBlock);
      } else {
        container.insertBefore(draggedBlock, afterElement);
      }
    });

    container.addEventListener('dragend', (e) => {
      if (draggedBlock) {
        draggedBlock.classList.remove('dragging-block');
        draggedBlock = null;
        this._saveLayoutOrder();
      }
    });
  }

  _getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.tb-quest-block:not(.dragging-block)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  async _saveLayoutOrder() {
    const container = this.$('#quests-container');
    if (!container) return;
    const blocks = container.querySelectorAll('.tb-quest-block');
    const order = Array.from(blocks).map(b => b.dataset.blockId);
    
    try {
      const profile = await ProfileService.getMe();
      if (profile) {
        const settings = profile.settings || {};
        settings.taskboard_layout = order;
        await ProfileService.updateMe({ settings });
      }
    } catch(e) { console.error("Failed to save layout order", e); }
  }

  async _loadLayoutOrder() {
    try {
      const profile = await ProfileService.getMe();
      if (profile && profile.settings && profile.settings.taskboard_layout) {
        const order = profile.settings.taskboard_layout;
        const container = this.$('#quests-container');
        if (container && order.length > 0) {
          order.forEach(blockId => {
            const block = container.querySelector(`[data-block-id="${blockId}"]`);
            if (block) container.appendChild(block);
          });
        }
      }
    } catch(e) { console.error("Failed to load layout order", e); }
  }

  // ============================================
  // TEMPLATE
  // ============================================
  async template() {
    const days = this._getWeekDays();
    const currentDateStr = this.state.currentDate.toISOString().split('T')[0];
    const dayLabels = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

    const daysHTML = days.map((d, i) => {
      const isActive = d.dateStr === currentDateStr;
      const isToday = d.dateStr === new Date().toISOString().split('T')[0];
      return `<div class="dn-day ${isActive ? 'dn-day--active' : ''} ${isToday ? 'dn-day--today' : ''}" data-date="${d.dateStr}">
        <span class="dn-day__name">${dayLabels[i]}</span>
        <span class="dn-day__num">${d.date.getDate()}</span>
      </div>`;
    }).join('');

    return `
      <div class="tb-root">
        <!-- TOP BAR: tabs + actions -->
        <div class="tb-topbar" id="tb-topbar">
          <div class="tb-tabs">
            <button class="tb-tab tb-tab--active" data-tab="my">
              <i data-lucide="user" style="width:13px;height:13px;"></i>
              Мої квести
            </button>
            <button class="tb-tab" data-tab="shared">
              <i data-lucide="users" style="width:13px;height:13px;"></i>
              Спільні квести
            </button>
          </div>
          <button class="tb-create-group" id="btn-create-group">
            <i data-lucide="plus" style="width:12px;height:12px;"></i>
            Створити групу
          </button>
        </div>

        <!-- BODY: 3 columns -->
        <div class="tb-body">
          <!-- COL 1: Timeline -->
          <div class="tb-col-timeline">
            <div class="tb-day-strip" id="day-strip">
              <button class="dn-arrow" data-action="prev-week">
                <i data-lucide="chevron-left" style="width:12px;height:12px;"></i>
              </button>
              ${daysHTML}
              <button class="dn-arrow" data-action="next-week">
                <i data-lucide="chevron-right" style="width:12px;height:12px;"></i>
              </button>
            </div>
            <div id="col-timeline" class="tb-timeline-scroll"></div>
          </div>

          <!-- COL 2: Quest List -->
          <div class="tb-col-quests" id="quests-container">
            <div id="col-quests-today" class="tb-quest-block" draggable="true" data-block-id="today"></div>
            <div id="col-quests-all" class="tb-quest-block" draggable="true" data-block-id="all"></div>
            <div id="col-quests-tomorrow" class="tb-quest-block" draggable="true" data-block-id="tomorrow"></div>
          </div>

          <!-- COL 3: Right Panel (always Eisenhower + Calendar) -->
          <div id="col-right-panel" class="tb-col-right"></div>
        </div>

        <!-- Floating Quest Details Popover -->
        <div id="quest-popover" class="quest-popover hidden"></div>
      </div>
    `;
  }

  // ============================================
  // WEEK DAYS
  // ============================================
  _getWeekDays() {
    const current = new Date(this.state.currentDate);
    const dow = current.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({ date: d, dateStr: d.toISOString().split('T')[0] });
    }
    return days;
  }

  // ============================================
  // TOP BAR
  // ============================================
  _initTopBar() {
    const bar = this.$('#tb-topbar');
    if (!bar) return;
    if (window.lucide) lucide.createIcons({ root: bar });
    bar.addEventListener('click', (e) => {
      const tab = e.target.closest('.tb-tab');
      if (tab) {
        this.$$('.tb-tab').forEach(t => t.classList.remove('tb-tab--active'));
        tab.classList.add('tb-tab--active');
        this.state.activeTab = tab.dataset.tab;
        // TODO: filter quests by tab
        return;
      }
      if (e.target.closest('#btn-create-group')) {
        console.log('[TaskBoard] Create shared group — TODO');
      }
    });
  }

  // ============================================
  // DAY NAV (inline strip)
  // ============================================
  _initDayNav() {
    const strip = this.$('#day-strip');
    if (!strip) return;
    if (window.lucide) lucide.createIcons({ root: strip });

    strip.addEventListener('click', (e) => {
      const dayEl = e.target.closest('.dn-day');
      if (dayEl) {
        this.state.currentDate = new Date(dayEl.dataset.date);
        this._refreshDayStrip();
        
        // Оновлюємо таймлайн одразу при кліку
        if (this.timeList) {
          this.timeList.props.currentDateStr = dayEl.dataset.date;
          this.timeList.refreshCells();
        }
        
        return;
      }
      const arrow = e.target.closest('.dn-arrow');
      if (!arrow) return;
      const delta = arrow.dataset.action === 'prev-week' ? -7 : 7;
      this.state.currentDate.setDate(this.state.currentDate.getDate() + delta);
      this._refreshDayStrip();
      
      if (this.timeList) {
        this.timeList.props.currentDateStr = this.state.currentDate.toISOString().split('T')[0];
        this.timeList.refreshCells();
      }
    });
  }

  async _refreshDayStrip() {
    const strip = this.$('#day-strip');
    if (!strip) return;
    const days = this._getWeekDays();
    const currentDateStr = this.state.currentDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const dayLabels = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

    const dayEls = strip.querySelectorAll('.dn-day');
    dayEls.forEach((el, i) => {
      const d = days[i];
      el.dataset.date = d.dateStr;
      el.querySelector('.dn-day__name').textContent = dayLabels[i];
      el.querySelector('.dn-day__num').textContent = d.date.getDate();
      el.classList.toggle('dn-day--active', d.dateStr === currentDateStr);
      el.classList.toggle('dn-day--today', d.dateStr === todayStr);
    });

    if (this.miniCalendar) {
      this.miniCalendar.props.currentDate = this.state.currentDate;
      this.miniCalendar.update();
    }

    // BUG-3 fix: перезагрузка квестов при смене дня
    await this.loadState();
    this._refreshAll();
  }

  // ============================================
  // COMPONENT INIT
  // ============================================
  async initTimeList() {
    this.timeList = new TimeList({
      questsData: this.state.questsData,
      activeQuestId: this.state.activeQuestId,
      currentDateStr: this.state.currentDate.toISOString().split('T')[0],
      onCreate: async (hour, startM, durH, durM) => {
        const tempId = 'quest-' + Date.now() + Math.random().toString(36).substring(2, 5);
        const currentDateStr = this.state.currentDate.toISOString().split('T')[0];
        const newTask = {
          title: `Квест ${this.state.questCounter}`, desc: '',
          hour, startM, durH, durM,
          color: this.timeList.getRandomColor(),
          completed: false, archived: false, media_assets: [],
          due_date: currentDateStr,
        };
        this.state.questsData[tempId] = newTask;
        this.state.questCounter++;
        this.timeList.injectTaskItemDOM(tempId, newTask);
        this.setActiveQuest(tempId);
        this._refreshAll();
        try {
          const created = await TaskService.create(newTask);
          if (created?.uuid) {
            delete this.state.questsData[tempId];
            this.state.questsData[created.uuid] = created;
            const row = this.element.querySelector(`[id="${tempId}"]`);
            if (row) row.id = created.uuid;
            if (this.state.activeQuestId === tempId) this.setActiveQuest(created.uuid);
            this._refreshAll();
          }
        } catch(e) { console.error("API Create Error", e); }
      },
      onCreateText: async (text, hour) => {
        const tempId = 'quest-' + Date.now();
        const currentDateStr = this.state.currentDate.toISOString().split('T')[0];
        const newTask = {
          title: text, desc: '', hour, startM: 0, durH: 1, durM: 0,
          color: this.timeList.getRandomColor(),
          completed: false, archived: false, media_assets: [],
          due_date: currentDateStr,
        };
        this.state.questsData[tempId] = newTask;
        this.state.questCounter++;
        this.timeList.injectTaskItemDOM(tempId, newTask);
        this._refreshAll();
        try {
          const created = await TaskService.create(newTask);
          if (created?.uuid) {
            delete this.state.questsData[tempId];
            this.state.questsData[created.uuid] = created;
            const row = this.element.querySelector(`[id="${tempId}"]`);
            if (row) row.id = created.uuid;
            if (this.state.activeQuestId === tempId) this.setActiveQuest(created.uuid);
            this._refreshAll();
          }
        } catch(e) { console.error("API Create Error", e); }
      },
      onSelect: (taskId) => this.setActiveQuest(taskId),
      onUpdateHour: (taskId, newHour) => {
        this.state.questsData[taskId].hour = newHour;
        this._refreshAll();
        if (!taskId.startsWith('quest-')) TaskService.update(taskId, { hour: newHour }).catch(e=>e);
      },
      onRandomizeColors: async () => {
        for (let key in this.state.questsData) {
          this.state.questsData[key].color = this.timeList.getRandomColor();
          if (!key.startsWith('quest-')) TaskService.update(key, { color: this.state.questsData[key].color }).catch(e=>e);
        }
        this._refreshAll();
      },
      onToggleDone: (taskId) => {
        this.state.questsData[taskId].completed = !this.state.questsData[taskId].completed;
        this._refreshAll();
        if (!taskId.startsWith('quest-')) TaskService.update(taskId, { completed: this.state.questsData[taskId].completed }).catch(e=>e);
      },
      onArchive: (taskId) => {
        this.state.questsData[taskId].archived = true;
        if (this.state.activeQuestId === taskId) this.setActiveQuest(null);
        this._refreshAll();
        if (!taskId.startsWith('quest-')) TaskService.update(taskId, { archived: true }).catch(e=>e);
      },
      onTrash: (taskId) => {
        delete this.state.questsData[taskId];
        if (this.state.activeQuestId === taskId) this.setActiveQuest(null);
        this._refreshAll();
        if (!taskId.startsWith('quest-')) TaskService.delete(taskId).catch(e=>e);
      }
    });
    await this.timeList.render(this.$('#col-timeline'), 'innerHTML');
  }

  async initQuestList() {
    // BUG FIX: Quests Today/Tomorrow should always be the REAL physical today/tomorrow,
    // not the currentDate selected in the day strip (which only controls the Timeline)
    const realToday = new Date();
    const todayStr = realToday.toISOString().split('T')[0];
    
    const realTomorrow = new Date(realToday);
    realTomorrow.setDate(realTomorrow.getDate() + 1);
    const tomorrowStr = realTomorrow.toISOString().split('T')[0];

    const deleteHandler = (taskId) => {
      delete this.state.questsData[taskId];
      if (this.state.activeQuestId === taskId) this._hideQuestPopover();
      // Remove DOM element from timeline
      const row = this.element.querySelector(`[id="${taskId}"]`);
      if (row) row.remove();
      this._refreshAll();
      if (!taskId.startsWith('quest-')) TaskService.delete(taskId).catch(e=>e);
    };

    this.questListToday = new QuestList({
      title: 'КВЕСТИ НА СЬОГОДНІ',
      questsData: this.state.questsData,
      activeQuestId: this.state.activeQuestId,
      filterFn: (id, q) => {
        const d = q.due_date;
        const dStr = d ? (d.includes('T') ? d.split('T')[0] : d) : null;
        return dStr === todayStr;
      },
      onSelect: (taskId) => this.setActiveQuest(taskId),
      onDelete: deleteHandler
    });
    
    this.questListAll = new QuestList({
      title: 'ВСІ КВЕСТИ',
      questsData: this.state.questsData,
      activeQuestId: this.state.activeQuestId,
      filterFn: (id, q) => true,
      onSelect: (taskId) => this.setActiveQuest(taskId),
      onDelete: deleteHandler
    });

    this.questListTomorrow = new QuestList({
      title: 'НА НАСТУПНИЙ ДЕНЬ',
      questsData: this.state.questsData,
      activeQuestId: this.state.activeQuestId,
      filterFn: (id, q) => {
        const d = q.due_date;
        const dStr = d ? (d.includes('T') ? d.split('T')[0] : d) : null;
        return dStr === tomorrowStr;
      },
      onSelect: (taskId) => this.setActiveQuest(taskId),
      onDelete: deleteHandler
    });

    await this.questListToday.render(this.$('#col-quests-today'), 'innerHTML');
    await this.questListAll.render(this.$('#col-quests-all'), 'innerHTML');
    await this.questListTomorrow.render(this.$('#col-quests-tomorrow'), 'innerHTML');
  }

  async initRightPanel() {
    const container = this.$('#col-right-panel');
    if (!container) return;

    this.questSettings = new QuestSettings({
      activeQuestId: this.state.activeQuestId,
      getQuestData: (id) => this.state.questsData[id],
      onUpdate: (taskId, updates) => {
        if (!this.state.questsData[taskId]) return;
        Object.assign(this.state.questsData[taskId], updates);
        this._refreshAll();
        if (!taskId.startsWith('quest-')) TaskService.update(taskId, updates).catch(e=>e);
      }
    });

    this.eisenhowerPanel = new EisenhowerPanel({
      questsData: this.state.questsData,
      onDropToQuadrant: (taskId, quadrant) => {
        if (this.state.questsData[taskId]) {
          this.state.questsData[taskId].quadrant = quadrant;
          this._refreshAll();
          if (!taskId.startsWith('quest-')) TaskService.update(taskId, { quadrant }).catch(e=>e);
        }
      },
      onSelectQuest: (taskId) => {
        this.setActiveQuest(taskId);
      }
    });

    this.miniCalendar = new MiniCalendar({
      currentDate: this.state.currentDate,
      questsData: this.state.questsData,
      onSelectDate: (dateStr) => {
        this.state.currentDate = new Date(dateStr);
        this._refreshDayStrip();
      }
    });

    this._showEisenhowerPanel();
  }

  // ============================================
  // RIGHT PANEL — always shows Eisenhower + Calendar
  // ============================================
  async _showEisenhowerPanel() {
    this.state.rightPanelMode = 'eisenhower';
    const c = this.$('#col-right-panel');
    if (!c) return;
    c.innerHTML = '';
    const eWrap = document.createElement('div');
    eWrap.className = 'rp-eisenhower-wrap';
    c.appendChild(eWrap);
    await this.eisenhowerPanel.render(eWrap, 'innerHTML');

    const cWrap = document.createElement('div');
    cWrap.className = 'rp-calendar-wrap';
    c.appendChild(cWrap);
    await this.miniCalendar.render(cWrap, 'innerHTML');
  }

  // ============================================
  // QUEST POPOVER — floating details overlay
  // ============================================
  async _showQuestPopover(taskId) {
    const popover = this.$('#quest-popover');
    if (!popover) return;

    this.questSettings.props.activeQuestId = taskId;
    popover.innerHTML = '';
    popover.classList.remove('hidden');

    // Render QuestSettings inside popover
    await this.questSettings.render(popover, 'innerHTML');

    // Position: fixed to right side of the quests column
    const questsCol = this.$('.tb-col-quests');
    if (questsCol) {
      const rect = questsCol.getBoundingClientRect();
      popover.style.top = rect.top + 'px';
      popover.style.left = (rect.right + 8) + 'px';
      // Ensure it doesn't go off-screen
      const popRect = popover.getBoundingClientRect();
      if (popRect.right > window.innerWidth - 10) {
        popover.style.left = (rect.left - popover.offsetWidth - 8) + 'px';
      }
      if (popRect.bottom > window.innerHeight - 10) {
        popover.style.top = Math.max(10, window.innerHeight - popover.offsetHeight - 10) + 'px';
      }
    }

    // Outside click to close
    const closeHandler = (e) => {
      if (!popover.contains(e.target) && !e.target.closest('.tb-list-item') && !e.target.closest('.task-item') && !e.target.closest('.eq-chip')) {
        this._hideQuestPopover();
        document.removeEventListener('mousedown', closeHandler);
      }
    };
    // Delay to avoid immediate close from the same click
    setTimeout(() => document.addEventListener('mousedown', closeHandler), 50);
  }

  _hideQuestPopover() {
    const popover = this.$('#quest-popover');
    if (popover) {
      popover.classList.add('hidden');
      popover.innerHTML = '';
    }
    this.state.activeQuestId = null;
    // Update highlights
    if (this.timeList) {
      this.timeList.props.activeQuestId = null;
      this.timeList.updateActiveQuestHighlight();
    }
    if (this.questListToday) {
      this.questListToday.props.activeQuestId = null;
      this.questListToday.refreshList();
    }
    if (this.questListAll) {
      this.questListAll.props.activeQuestId = null;
      this.questListAll.refreshList();
    }
    if (this.questListTomorrow) {
      this.questListTomorrow.props.activeQuestId = null;
      this.questListTomorrow.refreshList();
    }
  }

  // ============================================
  // ORCHESTRATION
  // ============================================
  async setActiveQuest(taskId) {
    this.state.activeQuestId = taskId;
    if (this.timeList) {
      this.timeList.props.activeQuestId = taskId;
      this.timeList.updateActiveQuestHighlight();
    }
    if (this.questListToday) {
      this.questListToday.props.activeQuestId = taskId;
      this.questListToday.refreshList();
    }
    if (this.questListAll) {
      this.questListAll.props.activeQuestId = taskId;
      this.questListAll.refreshList();
    }
    if (this.questListTomorrow) {
      this.questListTomorrow.props.activeQuestId = taskId;
      this.questListTomorrow.refreshList();
    }
    // Show floating popover instead of replacing the right panel
    if (taskId) {
      await this._showQuestPopover(taskId);
    } else {
      this._hideQuestPopover();
    }
  }

  _refreshAll() {
    // Sync live data references to all child components
    if (this.timeList) {
      this.timeList.props.questsData = this.state.questsData;
      this.timeList.refreshCells();
    }
    if (this.questListToday) {
      this.questListToday.props.questsData = this.state.questsData;
      this.questListToday.refreshList();
    }
    if (this.questListAll) {
      this.questListAll.props.questsData = this.state.questsData;
      this.questListAll.refreshList();
    }
    if (this.questListTomorrow) {
      this.questListTomorrow.props.questsData = this.state.questsData;
      this.questListTomorrow.refreshList();
    }
    if (this.eisenhowerPanel) {
      this.eisenhowerPanel.props.questsData = this.state.questsData;
      this.eisenhowerPanel.refresh();
    }
  }

  // ============================================
  // DATA
  // ============================================
  async loadState() {
    try {
      const currentDateStr = this.state.currentDate.toISOString().split('T')[0];
      // Fetch ALL tasks so we can show them in "All Quests" and filter locally
      const data = await TaskService.fetchAll();
      if (data) {
        this.state.questsData = data.items || {};
        for (const [key, q] of Object.entries(this.state.questsData)) {
          if (!q.media_assets) q.media_assets = [];
          if (q.hour == null) q.hour = 0;
          if (q.startM == null) q.startM = 0;
          if (q.durH == null) q.durH = 1;
          if (q.durM == null) q.durM = 0;
          if (!q.color) q.color = '#5c7482';
          if (q.completed == null) q.completed = false;
          if (q.archived == null) q.archived = false;
          if (!q.type) q.type = '';
          if (!q.subtype) q.subtype = '';
          if (q.quadrant === undefined) q.quadrant = null;
          if (q.lane === undefined) q.lane = 0;
          if (!q.due_date) q.due_date = currentDateStr;
        }
        this.state.questCounter = Object.keys(this.state.questsData).length + 1;
      }
    } catch(e) { console.error("Failed to load quests", e); }
  }
}
