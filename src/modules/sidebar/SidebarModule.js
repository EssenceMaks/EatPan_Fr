import Component from '../../core/Component.js';

export const THEMES = [
  { id: 'royal', name: 'Royal', colors: ['#0b0e14', '#c5a059', '#1c2128'] },
  { id: 'silver', name: 'Silver', colors: ['#120d1a', '#a8b2c1', '#251c33'] },
  { id: 'bronze', name: 'Bronze', colors: ['#1a1614', '#cd7f32', '#362d26'] },
  { id: 'tangerine', name: 'Tangerine', colors: ['#1f1f1f', '#ff8c00', '#3a3a3a'] },
  { id: 'neon', name: 'Neon', colors: ['#050510', '#00ffff', '#101030'] },
  { id: 'scroll', name: 'Scroll', colors: ['#d2b48c', '#8b4513', '#f5deb3'] },
  { id: 'cartoon', name: 'Cartoon', colors: ['#e0f7fa', '#ff6f00', '#ffffff'] },
  { id: 'cyber', name: 'Cyber', colors: ['#0d0d0d', '#39ff14', '#262626'] },
  { id: 'ledger', name: 'Ledger', colors: ['#fdf5e6', '#dc143c', '#ffffff'] }
];

export default class SidebarModule extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      isOpen: false,
      currentTheme: localStorage.getItem('eatpan_theme') || 'royal'
    };
  }

  async template() {
    const renderThemeOption = (theme) => {
      const isActive = theme.id === this.state.currentTheme;
      const swatches = theme.colors.map(color => `<div class="theme-color-swatch" style="background: ${color}"></div>`).join('');
      
      return `
        <button class="theme-btn ${isActive ? 'active' : ''}" data-theme="${theme.id}">
          <div class="theme-preview-colors">${swatches}</div>
          <span>${theme.name}</span>
        </button>
      `;
    };

    const overlayCls = this.state.isOpen ? 'sidebar-overlay active' : 'sidebar-overlay';

    return `
      <div id="sidebarMenuOverlay" class="${overlayCls}">
        <div class="sidebar-drawer">
          <div class="sidebar-header">
            <h2>Налаштування</h2>
            <button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Close menu">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="sidebar-content">
            <div class="theme-selector">
              <h3><i data-lucide="palette"></i> Стиль та Тема</h3>
              <div class="theme-grid">
                ${THEMES.map(renderThemeOption).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const overlay = this.element.querySelector('#sidebarMenuOverlay');
    const closeBtn = this.element.querySelector('#sidebarCloseBtn');
    const drawer = this.element.querySelector('.sidebar-drawer');

    // Close on overlay click
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Theme buttons
    const themeBtns = this.element.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const themeId = e.currentTarget.getAttribute('data-theme');
        if (themeId) {
          this.setTheme(themeId);
          // Auto close on select option? Let's leave it open so user can preview various themes
        }
      });
    });

    // We must re-init lucide icons because we dynamically injected the DOM
    if (window.lucide) {
      window.lucide.createIcons({ root: this.element });
    }
  }

  open() {
    this.state.isOpen = true;
    this.update();
  }

  close() {
    this.state.isOpen = false;
    this.update();
  }

  setTheme(themeId) {
    if (!themeId) return;

    // Remove old theme classes
    document.body.classList.remove(...THEMES.map(t => `theme-${t.id}`));
    
    // Default fallback to 'royal' which doesn't need a class, but we can add it to be consistent
    document.body.classList.add(`theme-${themeId}`);
    
    // Save state
    this.state.currentTheme = themeId;
    localStorage.setItem('eatpan_theme', themeId);
    
    // update to reflect active btn state
    this.update(); 
  }

  async onMount() {
    // initial setup
    const savedTheme = localStorage.getItem('eatpan_theme');
    if (savedTheme) {
      // Just apply class immediately on load
      document.body.classList.add(`theme-${savedTheme}`);
    } else {
      document.body.classList.add(`theme-royal`); // Default
    }
    
    // Global bind to the burger menu button in Header
    document.body.addEventListener('click', (e) => {
      const menuBtn = e.target.closest('#menuBtn');
      if (menuBtn) {
         this.open();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.close();
      }
    });
  }
}
