import Component from '../../core/Component.js';

/**
 * EisenhowerPanel — 2×2 матриця пріоритетів
 * Квадранти: urgent_important, important, urgent, neither
 * Підтримує drag-and-drop квестів із QuestList
 */
export default class EisenhowerPanel extends Component {
  constructor(props = {}) {
    super(props);
    // props: questsData, onDropToQuadrant(taskId, quadrant), onSelectQuest(taskId)
  }

  async template() {
    return `
      <div class="eisenhower-panel">
        <div class="eisenhower-title">
          <i data-lucide="grid-2x2" style="width:14px;height:14px;"></i>
          Пріоритети
        </div>
        <div class="eisenhower-grid">
          <div class="eisenhower-quadrant eq-urgent-important" data-quadrant="urgent_important"
               data-drop-zone="true">
            <div class="eq-label">
              <span class="eq-dot eq-dot--red"></span>
              Терміново & Важливо
            </div>
            <div class="eq-items" data-quadrant="urgent_important"></div>
          </div>
          <div class="eisenhower-quadrant eq-important" data-quadrant="important"
               data-drop-zone="true">
            <div class="eq-label">
              <span class="eq-dot eq-dot--gold"></span>
              Важливо
            </div>
            <div class="eq-items" data-quadrant="important"></div>
          </div>
          <div class="eisenhower-quadrant eq-urgent" data-quadrant="urgent"
               data-drop-zone="true">
            <div class="eq-label">
              <span class="eq-dot eq-dot--blue"></span>
              Терміново
            </div>
            <div class="eq-items" data-quadrant="urgent"></div>
          </div>
          <div class="eisenhower-quadrant eq-neither" data-quadrant="neither"
               data-drop-zone="true">
            <div class="eq-label">
              <span class="eq-dot eq-dot--gray"></span>
              Делегувати / Потім
            </div>
            <div class="eq-items" data-quadrant="neither"></div>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    this._setupDropZones();
    this.refresh();
    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  refresh() {
    const data = this.props.questsData || {};
    // Clear all quadrant items
    this.$$('.eq-items').forEach(el => el.innerHTML = '');

    for (const [id, q] of Object.entries(data)) {
      if (q.archived) continue;
      const quadrant = q.quadrant;
      if (!quadrant) continue;
      const container = this.$(`.eq-items[data-quadrant="${quadrant}"]`);
      if (!container) continue;

      const chip = document.createElement('div');
      chip.className = 'eq-chip';
      chip.draggable = true;
      chip.dataset.taskId = id;
      chip.style.borderLeftColor = q.color || '#666';
      chip.innerHTML = `
        <span class="eq-chip__title">${q.title || 'Квест'}</span>
        ${q.completed ? '<span class="eq-chip__done">✓</span>' : ''}
      `;
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
      chip.addEventListener('dblclick', () => {
        if (this.props.onSelectQuest) this.props.onSelectQuest(id);
      });
      container.appendChild(chip);
    }
  }

  _setupDropZones() {
    this.$$('[data-drop-zone]').forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('eq-drop-hover');
      });
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('eq-drop-hover');
      });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('eq-drop-hover');
        const taskId = e.dataTransfer.getData('text/plain');
        const quadrant = zone.dataset.quadrant;
        if (taskId && quadrant && this.props.onDropToQuadrant) {
          this.props.onDropToQuadrant(taskId, quadrant);
        }
      });
    });
  }
}
