import Component from '../../core/Component.js';

export default class QuestList extends Component {
  constructor(props) {
    super(props);
  }

  async template() {
    return `
      <div class="tb-questlist-col">
        <div class="tb-sidebar-header">${this.props.title || 'КВЕСТИ НА ДЕНЬ'}</div>
        <div class="tb-list-container" id="quest-list-container">
           <!-- Quests injected here via JS -->
        </div>
      </div>
    `;
  }

  async onMount() {
    this.refreshList();
    
    // Делегування кліків
    this.element.addEventListener('click', (e) => {
       // Check action buttons first
       const actionBtn = e.target.closest('.tb-list-action');
       if (actionBtn) {
           e.stopPropagation();
           const row = actionBtn.closest('.tb-list-item');
           const taskId = row?.dataset.taskId;
           if (!taskId) return;
           
           const action = actionBtn.dataset.action;
           if (action === 'delete' && this.props.onDelete) {
               if (confirm('Видалити квест?')) this.props.onDelete(taskId);
           } else if (action === 'edit' && this.props.onSelect) {
               this.props.onSelect(taskId);
           }
           return;
       }
       
       const row = e.target.closest('.tb-list-item');
       if (row && row.dataset.taskId) {
           if (this.props.onSelect) this.props.onSelect(row.dataset.taskId);
       }
    });
  }

  // Оновлює UI списку без перемонтування
  refreshList() {
    if (!this._mounted) return;
    const listContainer = this.element.querySelector('#quest-list-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // Сортування та фільтрація квестів
    let entries = Object.entries(this.props.questsData).filter(([_, q]) => !q.archived);
    if (this.props.filterFn) {
        entries = entries.filter(([id, q]) => this.props.filterFn(id, q));
    }
    
    const sorted = entries.sort((a, b) => {
            let aMin = a[1].hour * 60 + a[1].startM;
            let bMin = b[1].hour * 60 + b[1].startM;
            return aMin - bMin;
        });

    sorted.forEach(([taskId, quest]) => {
        const item = document.createElement('div');
        item.className = `tb-list-item ${this.props.activeQuestId === taskId ? 'active' : ''}`;
        item.dataset.taskId = taskId;
        
        // BUG-4 fix: drag-and-drop в Eisenhower квадранты
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', taskId);
          e.dataTransfer.effectAllowed = 'move';
          item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => item.classList.remove('dragging'));

        const dot = document.createElement('div');
        dot.className = 'tb-list-color-dot';
        dot.style.backgroundColor = quest.color;
        
        const text = document.createElement('span');
        text.className = 'tb-list-item-title';
        text.textContent = quest.title || 'Новий квест';
        
        // Закреслення, якщо виконано
        if(quest.completed) {
            text.style.textDecoration = 'line-through';
            text.style.opacity = '0.7';
            dot.style.backgroundColor = '#3b4d56';
        }

        // Hover actions
        const actions = document.createElement('div');
        actions.className = 'tb-list-actions';
        actions.innerHTML = `
          <span class="tb-list-action" data-action="edit" title="Редагувати">✏️</span>
          <span class="tb-list-action" data-action="delete" title="Видалити">🗑️</span>
        `;

        item.appendChild(dot);
        item.appendChild(text);
        item.appendChild(actions);
        
        listContainer.appendChild(item);
    });
  }
}
