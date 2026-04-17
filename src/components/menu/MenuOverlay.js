/**
 * MenuOverlay — RPG-стильне меню з вибором тем
 * Живе в межах #main-content, не перекриває header/footer
 */
import Component from '../../core/Component.js';

const THEMES = [
  { id: '',          name: 'Fantasy',   color: '#c5a044' },
  { id: 'vintage',   name: 'Vintage',   color: '#6b0d12' },
  { id: 'royal',     name: 'Royal',     color: '#c5a059' },
  { id: 'bronze',    name: 'Bronze',    color: '#cd7f32' },
  { id: 'silver',    name: 'Silver',    color: '#a8b2c1' },
  { id: 'neon',      name: 'Neon',      color: '#00ffff' },
  { id: 'tangerine', name: 'Tangerine', color: '#ff8c00' },
  { id: 'scroll',    name: 'Scroll',    color: '#8b4513' },
  { id: 'cyber',     name: 'Cyber',     color: '#39ff14' },
];

export default class MenuOverlay extends Component {
  constructor(props = {}) {
    super(props);
    this.onAction = props.onAction || (() => {});
  }

  async template() {
    const swatches = THEMES.map(t => `
      <button class="theme-swatch" data-theme="${t.id}" title="${t.name}"
              style="background:${t.color};"></button>
    `).join('');

    return `
        <div id="menu-content" class="rpg-panel rpg-panel--ornate">
          <h3 style="font-family:var(--font-title);color:var(--text-accent);text-align:center;
                     font-size:1.2rem;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em;">
            <i data-lucide="scroll" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
            Menu
          </h3>
          <div class="rpg-divider"></div>

          <div class="menu-section">
            <div class="menu-section-title">
              <i data-lucide="palette" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>
              Choose Style
            </div>
            <div class="theme-grid">${swatches}</div>
          </div>

          <div class="rpg-divider"></div>

          <div class="menu-section menu-actions" style="display:grid;gap:10px;">
            <button class="rpg-btn menu-action-btn" data-action="profile">
              <i data-lucide="user" style="width:16px;height:16px;"></i> Profile
            </button>
            <button class="rpg-btn menu-action-btn" data-action="auth">
              <i data-lucide="log-in" style="width:16px;height:16px;"></i> Sign In
            </button>
            <button class="rpg-btn rpg-btn--danger menu-action-btn" data-action="close">
              <i data-lucide="x" style="width:16px;height:16px;"></i> Close
            </button>
          </div>
        </div>
    `;
  }

  async onMount() {
    // Theme switching
    this.$$('.theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.dataset.theme;
        document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
        if (themeId) document.body.classList.add(`theme-${themeId}`);
        localStorage.setItem('eatpan-theme', themeId);
        this.$$('.theme-swatch').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Mark current theme
    const saved = localStorage.getItem('eatpan-theme') || '';
    const activeBtn = this.element.querySelector(`.theme-swatch[data-theme="${saved}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Action buttons
    this.$$('.menu-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.close();
        if (action !== 'close') {
          setTimeout(() => this.onAction(action), 200);
        }
      });
    });

    // Click outside to close
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  open() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.add('open');
  }

  close() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  get isOpen() {
    const overlay = document.getElementById('menu-overlay');
    return overlay ? overlay.classList.contains('open') : false;
  }
}

export { THEMES };
