import Component from '../../../core/Component.js';

export default class RecipeGroups extends Component {
  constructor(props = {}) {
    super(props);
    this.groups = props.groups || [];
    this.activeGroup = props.activeGroup || 'all';
    this.onGroupSelect = props.onGroupSelect || (() => {});
  }

  async template() {
    return `
      <div class="rb-groups-container">
        <div class="rb-groups-tabs">
          <button class="rb-group-btn ${this.activeGroup === 'all' ? 'active' : ''}" data-group="all">Всі рецепти</button>
          ${this.groups.map(g => `
            <button class="rb-group-btn ${this.activeGroup === g ? 'active' : ''}" data-group="${g}">${g}</button>
          `).join('')}
        </div>
        <div class="rb-groups-divider"></div>
      </div>
    `;
  }

  async onMount() {
    this.$$('.rb-group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const group = e.currentTarget.getAttribute('data-group');
        this.onGroupSelect(group);
      });
    });
  }

  updateData(groups, activeGroup) {
    this.groups = groups;
    this.activeGroup = activeGroup;
    this.update();
  }
}
