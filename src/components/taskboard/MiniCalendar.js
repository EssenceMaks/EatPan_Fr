import Component from '../../core/Component.js';

/**
 * MiniCalendar — компактний календар місяця
 * props: currentDate, questsData, onSelectDate(date)
 */
export default class MiniCalendar extends Component {
  constructor(props = {}) {
    super(props);
    this.viewDate = props.currentDate ? new Date(props.currentDate) : new Date();
  }

  async template() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const monthName = this.viewDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday-based week (0=Mon, 6=Sun)
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentDateStr = this.props.currentDate
      ? new Date(this.props.currentDate).toISOString().split('T')[0]
      : todayStr;

    // Collect dates with quests
    const questDates = new Set();
    for (const q of Object.values(this.props.questsData || {})) {
      if (q.due_date) questDates.add(q.due_date);
    }

    let cells = '';
    // Empty cells before first day
    for (let i = 0; i < startWeekday; i++) {
      cells += '<div class="mc-cell mc-cell--empty"></div>';
    }
    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === currentDateStr;
      const hasQuests = questDates.has(dateStr);
      
      let cls = 'mc-cell';
      if (isToday) cls += ' mc-cell--today';
      if (isSelected) cls += ' mc-cell--selected';
      if (hasQuests) cls += ' mc-cell--has-quests';

      cells += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
    }

    return `
      <div class="mini-calendar">
        <div class="mc-header">
          <button class="mc-nav" data-action="prev-month">
            <i data-lucide="chevron-left" style="width:12px;height:12px;"></i>
          </button>
          <span class="mc-month-name">${monthName}</span>
          <button class="mc-nav" data-action="next-month">
            <i data-lucide="chevron-right" style="width:12px;height:12px;"></i>
          </button>
        </div>
        <div class="mc-weekdays">
          <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Нд</span>
        </div>
        <div class="mc-grid">${cells}</div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => {
      const cell = e.target.closest('.mc-cell[data-date]');
      if (cell) {
        if (this.props.onSelectDate) this.props.onSelectDate(cell.dataset.date);
        return;
      }
      const nav = e.target.closest('[data-action]');
      if (!nav) return;
      if (nav.dataset.action === 'prev-month') {
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.update();
      } else if (nav.dataset.action === 'next-month') {
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.update();
      }
    });
  }
}
