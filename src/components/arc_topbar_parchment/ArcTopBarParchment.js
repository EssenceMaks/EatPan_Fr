import Component from '../../core/Component.js';

export default class ArcTopBarParchment extends Component {
  constructor(props = {}) {
    super(props);
    // props: { name, stamina: {value,max}, exp: {value,max}, gold, gems }
  }

  async template() {
    const name = this.props.name || 'SIR GALAHAD';
    const stamina = this.props.stamina || { value: 80, max: 100 };
    const exp = this.props.exp || { value: 350, max: 1000 };
    const gold = this.props.gold ?? 1250;
    const gems = this.props.gems ?? 50;
    const staminaPct = Math.round((stamina.value / stamina.max) * 100);
    const expPct = Math.round((exp.value / exp.max) * 100);

    return `
      <div class="arc-topbar-parchment">
        <div class="arc-topbar-parchment__inner">
          <div class="arc-topbar-parchment__avatar">
            <i data-lucide="user" style="width:36px;height:36px;"></i>
          </div>
          <div class="arc-topbar-parchment__stats">
            <!-- Stat bars using atomic FluxStatBar patterns -->
            <div class="arc-flux-stat">
              <span class="arc-flux-stat__label">СТАМИНА</span>
              <div class="arc-flux-stat__track">
                <div class="arc-flux-stat__fill arc-flux-stat__fill--stamina" style="width:${staminaPct}%"></div>
              </div>
              <span class="arc-flux-stat__value">${stamina.value}/${stamina.max}</span>
            </div>
            <div class="arc-flux-stat">
              <span class="arc-flux-stat__label">ОПЫТ</span>
              <div class="arc-flux-stat__track">
                <div class="arc-flux-stat__fill arc-flux-stat__fill--exp" style="width:${expPct}%"></div>
              </div>
              <span class="arc-flux-stat__value">${exp.value}/${exp.max}</span>
            </div>
            <!-- Resources -->
            <div style="display:flex;gap:6px;">
              <div class="arc-topbar-parchment__resource-row">
                <i data-lucide="coins" class="arc-topbar-parchment__resource-icon" style="width:14px;height:14px;"></i>
                <span class="arc-topbar-parchment__resource-val">${gold}</span>
              </div>
              <div class="arc-topbar-parchment__resource-row">
                <i data-lucide="gem" class="arc-topbar-parchment__resource-icon" style="width:14px;height:14px;"></i>
                <span class="arc-topbar-parchment__resource-val">${gems}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
