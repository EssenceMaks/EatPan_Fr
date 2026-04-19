import Component from '../../core/Component.js';
import { supabase } from '../../core/supabaseClient.js';
import { TaskService } from '../../core/ApiClient.js';
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
    if (session?.user?.id) this.state.userId = session.user.id;
    await this.loadState();
    this._initTopBar();
    this._initDayNav();
    await this.initTimeList();
    await this.initQuestList();
    await this.initRightPanel();
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
          <!-- COL 1: Day nav + Timeline -->
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
          <div id="col-questlist" class="tb-col-quests"></div>

          <!-- COL 3: Right Panel -->
          <div id="col-right-panel" class="tb-col-right"></div>
        </div>
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
        return;
      }
      const arrow = e.target.closest('.dn-arrow');
      if (!arrow) return;
      const delta = arrow.dataset.action === 'prev-week' ? -7 : 7;
      this.state.currentDate.setDate(this.state.currentDate.getDate() + delta);
      this._refreshDayStrip();
    });
  }

  _refreshDayStrip() {
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
  }

  // ============================================
  // COMPONENT INIT
  // ============================================
  async initTimeList() {
    this.timeList = new TimeList({
      questsData: this.state.questsData,
      activeQuestId: this.state.activeQuestId,
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
    this.questList = new QuestList({
      questsData: this.state.questsData,
      activeQuestId: this.state.activeQuestId,
      onSelect: (taskId) => this.setActiveQuest(taskId)
    });
    await this.questList.render(this.$('#col-questlist'), 'innerHTML');
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
          this.eisenhowerPanel.refresh();
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
  // RIGHT PANEL TOGGLE
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

  async _showDetailsPanel() {
    this.state.rightPanelMode = 'details';
    const c = this.$('#col-right-panel');
    if (!c) return;
    c.innerHTML = '';
    // Back button
    const back = document.createElement('div');
    back.className = 'rp-back';
    back.innerHTML = `<i data-lucide="arrow-left" style="width:12px;height:12px;"></i> Пріоритети`;
    back.addEventListener('click', () => this._showEisenhowerPanel());
    c.appendChild(back);
    if (window.lucide) lucide.createIcons({ root: back });
    // Settings
    const sWrap = document.createElement('div');
    sWrap.className = 'rp-settings-wrap';
    c.appendChild(sWrap);
    this.questSettings.props.activeQuestId = this.state.activeQuestId;
    await this.questSettings.render(sWrap, 'innerHTML');
  }

  // ============================================
  // ORCHESTRATION
  // ============================================
  setActiveQuest(taskId) {
    this.state.activeQuestId = taskId;
    if (this.timeList) {
      this.timeList.props.activeQuestId = taskId;
      this.timeList.updateActiveQuestHighlight();
    }
    if (this.questList) {
      this.questList.props.activeQuestId = taskId;
      this.questList.refreshList();
    }
    // Switch right panel based on selection
    if (taskId) {
      if (this.state.rightPanelMode === 'details' && this.questSettings && this.questSettings._mounted) {
        // Already in details mode — just refresh
        this.questSettings.props.activeQuestId = taskId;
        this.questSettings.renderDetails();
      } else {
        // Switch from Eisenhower to Details
        this._showDetailsPanel();
      }
    } else {
      // No quest selected — go back to Eisenhower
      if (this.state.rightPanelMode === 'details') {
        this._showEisenhowerPanel();
      }
    }
  }

  _refreshAll() {
    if (this.timeList) this.timeList.refreshCells();
    if (this.questList) this.questList.refreshList();
    if (this.eisenhowerPanel) this.eisenhowerPanel.refresh();
    if (this.state.rightPanelMode === 'details' && this.questSettings) this.questSettings.renderDetails();
  }

  // ============================================
  // DATA
  // ============================================
  async loadState() {
    try {
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
          if (!q.due_date) q.due_date = '';
        }
        this.state.questCounter = Object.keys(this.state.questsData).length + 1;
      }
    } catch(e) { console.error("Failed to load quests", e); }
  }
}
