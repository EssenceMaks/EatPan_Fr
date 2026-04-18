import Component from '../../core/Component.js';

export default class QuestList extends Component {
  constructor(props) {
    super(props);
  }

  async template() {
    return `
      <div class="tb-questlist-col">
        <div class="tb-sidebar-header">КВЕСТЫ НА ДЕНЬ</div>
        <div class="tb-list-container" id="quest-list-container">
           <!-- Quests injected here via JS -->
        </div>
      </div>
    `;
  }

  async onMount() {
    this.refreshList();
    
    // Delegation for clicks
    this.element.addEventListener('click', (e) => {
       const row = e.target.closest('.tb-list-item');
       if (row && row.dataset.taskId) {
           if (this.props.onSelect) this.props.onSelect(row.dataset.taskId);
       }
    });
  }

  // Refreshes the list UI directly without re-mounting
  refreshList() {
    if (!this._mounted) return;
    const listContainer = this.element.querySelector('#quest-list-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // Sort quests chronologically
    const sorted = Object.entries(this.props.questsData)
        .filter(([_, q]) => !q.archived)
        .sort((a, b) => {
            let aMin = a[1].hour * 60 + a[1].startM;
            let bMin = b[1].hour * 60 + b[1].startM;
            return aMin - bMin;
        });

    sorted.forEach(([taskId, quest]) => {
        const item = document.createElement('div');
        item.className = `tb-list-item ${this.props.activeQuestId === taskId ? 'active' : ''}`;
        item.dataset.taskId = taskId;
        
        const dot = document.createElement('div');
        dot.className = 'tb-list-color-dot';
        dot.style.backgroundColor = quest.color;
        
        const text = document.createElement('span');
        text.textContent = quest.title || 'Новый квест';
        
        // Strikethrough if completed
        if(quest.completed) {
            text.style.textDecoration = 'line-through';
            text.style.opacity = '0.7';
            dot.style.backgroundColor = '#3b4d56';
        }

        item.appendChild(dot);
        item.appendChild(text);
        
        listContainer.appendChild(item);
    });
  }
}
