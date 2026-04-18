/**
 * MenuOverlay — RPG-стильне меню
 * Відповідає за головну навігацію (Сектори) і вибір тем
 * Працює як модальне вікно поверх всіх секторів в #main-content
 */
import Component from '../../core/Component.js';
import { SECTORS } from '../sector_carousel/SectorCarousel.js';

export default class MenuOverlay extends Component {
  constructor(props = {}) {
    super(props);
    this.onAction = props.onAction || (() => {});
  }

  async template() {
    return `
      <div id="menu-content" class="rpg-panel">
        
        <!-- ================= ШАПКА ================= -->
        <div class="main-menu-header">
          <button class="main-menu-close" aria-label="Close menu">
            <i data-lucide="x" style="width:24px;height:24px;"></i>
          </button>
          <div class="main-menu-title">ГОЛОВНЕ МЕНЮ</div>
          <!-- Галтель з класичного UI Kit EatPan -->
          <div class="edge-galtel" style="margin-top: 15px;"></div>
        </div>

        <!-- ================= КОНТЕНТ (СКРОЛЛ) ================= -->
        <div class="main-menu-body">
          
          <!-- Секція Навігації -->
          <div class="main-menu-section">
            <div class="main-menu-subtitle">НАВІГАЦІЯ</div>
            <div class="menu-nav-grid">
            ${SECTORS.map(s => `
              <button class="menu-nav-btn" data-action="goto-${s.id}">
                <i data-lucide="${s.icon}"></i>
                <span class="menu-nav-label">${s.title}</span>
              </button>
            `).join('')}
            </div>
          </div>

          <div class="edge-galtel" style="margin-bottom: 25px; opacity: 0.5;"></div>

          <!-- Секція Стилизації -->
          <div class="main-menu-section">
            <div class="main-menu-subtitle">СТИЛЬ ПРОЕКТУ</div>
            <!-- Theme Switcher -->
            <div class="arc-theme-switcher">
              <button class="arc-theme-btn t-fantasy" data-theme="">ROYAL PAPER</button>
              <button class="arc-theme-btn t-royal" data-theme="theme-royal">ROYAL BLUE</button>
              <button class="arc-theme-btn t-vintage" data-theme="theme-vintage">VINTAGE</button>
              <button class="arc-theme-btn t-cyber" data-theme="theme-cyber">CYBER</button>
              <button class="arc-theme-btn t-scroll" data-theme="theme-scroll">SCROLL</button>
              <button class="arc-theme-btn t-bronze" data-theme="theme-bronze">BRONZE</button>
              <button class="arc-theme-btn t-silver" data-theme="theme-silver">SILVER</button>
              <button class="arc-theme-btn t-neon" data-theme="theme-neon">NEON</button>
              <button class="arc-theme-btn t-tanger" data-theme="theme-tangerine">TANGERINE</button>
              <button class="arc-theme-btn t-blue" data-theme="arc-dark-blue">BLUE</button>
              <button class="arc-theme-btn t-red" data-theme="arc-dark-red">RED</button>
              <button class="arc-theme-btn t-green" data-theme="arc-dark-green">GREEN</button>
            </div>
          </div>

        </div>

        <!-- ================= ПІДВАЛ ================= -->
        <div class="main-menu-footer">
          <div>EatPan Corporation</div>
          <div style="opacity: 0.5; margin-top: 4px;">© 2026. All Rights Reserved.</div>
        </div>

      </div>
    `;
  }

  async onMount() {
    // 1. Theme Configuration
    this.$$('.arc-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.dataset.theme;
        this._setTheme(themeId, btn);
      });
    });

    // Mark current theme as active
    const saved = localStorage.getItem('eatpan-theme') || '';
    const activeBtn = this.element.querySelector(`.arc-theme-btn[data-theme="${saved}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    } else {
      const defaultBtn = this.element.querySelector('.arc-theme-btn.t-fantasy');
      if (defaultBtn) defaultBtn.classList.add('active');
    }

    // 2. Navigation Actions
    this.$$('.menu-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.close();
        if (action !== 'close') {
          setTimeout(() => this.onAction(action), 200);
        }
      });
    });

    // 3. Close Button
    const closeBtn = this.element.querySelector('.main-menu-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // 4. Click outside to close (overlay background)
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    // 5. Initialize Lucide Icons
    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  /**
   * Applies the selected theme to body and saves to localStorage
   */
   _setTheme(themeId, btnElement) {
     // Remove any existing theme class
     document.body.className = document.body.className.replace(/(theme-|arc-dark-)\S+/g, '').trim();
     
     if (themeId) {
        document.body.classList.add(themeId);
     }
     
     localStorage.setItem('eatpan-theme', themeId);
     
     // Update UI
     this.$$('.arc-theme-btn').forEach(s => s.classList.remove('active'));
     if (btnElement) {
        btnElement.classList.add('active');
     }
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
