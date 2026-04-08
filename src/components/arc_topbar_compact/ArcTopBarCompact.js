import Component from '../../core/Component.js';

export default class ArcTopBarCompact extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    const name = this.props.name || 'IRON CHEF';
    const level = this.props.level ?? 42;
    const lvlPct = this.props.lvlPct ?? 70;
    const gold = this.props.gold ?? 1250;
    const gems = this.props.gems ?? 50;

    return `
      <div class="arc-topbar-compact">
        <div class="arc-topbar-compact__avatar">
          <i data-lucide="user" style="width:24px;height:24px;"></i>
        </div>
        <div class="arc-topbar-compact__info">
          <div class="arc-topbar-compact__name">${name}</div>
          <div class="arc-topbar-compact__lvl-bar">
            <span class="arc-topbar-compact__lvl-text">LV ${level}</span>
            <div class="arc-topbar-compact__bar-track">
              <div class="arc-topbar-compact__bar-fill" style="width:${lvlPct}%"></div>
            </div>
          </div>
        </div>
        <div class="arc-topbar-compact__currencies">
          <div class="arc-topbar-compact__curr-box">
            <i data-lucide="coins" style="width:12px;height:12px;color:var(--gold-light);"></i>
            <span>${gold}</span>
            <div class="arc-topbar-compact__curr-add">+</div>
          </div>
          <div class="arc-topbar-compact__curr-box">
            <i data-lucide="gem" style="width:12px;height:12px;color:#52c2d6;"></i>
            <span>${gems}</span>
            <div class="arc-topbar-compact__curr-add">+</div>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
