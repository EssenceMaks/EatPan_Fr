/**
 * AppShell — головний інтерфейс додатку
 * Керує: header, footer, carousel, menu, clock, user state
 * 
 * Використовує CSS Grid для internal layout,
 * делегує каруссель до SectorCarousel
 */
import Component from '../../core/Component.js';
import SectorCarousel from '../sector_carousel/SectorCarousel.js';
import MenuOverlay from '../menu/MenuOverlay.js';
import ArcBentoHeader from '../arc_bento_header/ArcBentoHeader.js';

export default class AppShell extends Component {
  constructor(props = {}) {
    super(props);
    this.carousel = null;  // SectorCarousel instance
    this.menu = null;       // MenuOverlay instance
    this.clockInterval = null;
  }

  async template() {
    // AppShell does NOT render HTML — it works with existing DOM from index.html
    // Instead, it initializes sub-components and binds events
    return '<span data-role="app-shell-ghost"></span>';
  }

  /**
   * Initialize — call this instead of render() since DOM is in index.html
   */
  async init() {
    this.mainContent = document.getElementById('main-content');

    // 1. Load saved theme
    this._loadTheme();

    // 2. Mount SectorCarousel
    this.carousel = new SectorCarousel({
      onBlockActivated: (el) => this._onBlockActivated(el),
      onBlockDeactivated: () => this._onBlockDeactivated(),
    });
    const carouselTarget = document.getElementById('sector-carousel');
    if (carouselTarget) {
      await this.carousel.render(carouselTarget.parentNode, 'innerHTML');
    }

    // 3. Mount MenuOverlay
    this.menu = new MenuOverlay({
      onAction: (action) => this._handleMenuAction(action),
    });
    const menuTarget = document.getElementById('menu-overlay');
    if (menuTarget) {
      await this.menu.render(menuTarget, 'innerHTML');
    }

    // 4. Mount Header
    await this._mountHeader();

    // 5. Setup header clock
    this._startClock();

    // 6. Init Lucide icons
    if (window.lucide) lucide.createIcons();

    // 7. Expose globals for compatibility
    this._exposeGlobals();

    console.log('🎮 EatPan Frontend v2 — AppShell initialized');
  }

  // ============================================================
  // HEADER MOUNT
  // ============================================================
  async _mountHeader() {
    let isAuth = !!localStorage.getItem('eatpan_header_auth_user');
    
    this.header = new ArcBentoHeader({
      isAuth,
      onLoginClick: () => {
        if (this.menu?.isOpen) this.menu.close();
        if (document.body.classList.contains('active-mode')) {
          history.back();
          return;
        }
        
        // TEMPORARY: Toggle the auth state to immediately show/hide user block
        isAuth = !isAuth;
        if (isAuth) {
          localStorage.setItem('eatpan_header_auth_user', 'true');
        } else {
          localStorage.removeItem('eatpan_header_auth_user');
        }
        
        if (this.header) {
          this.header.setAuth(isAuth);
        }
      },
      onClockClick: () => {
        if (this.menu?.isOpen) this.menu.close();
        if (document.body.classList.contains('clock-mode')) {
          history.back();
          return;
        }
        this.carousel?.toggleClockWedge();
      },
      onMenuClick: () => {
        this.menu?.toggle();
      },
      onBackClick: () => {
        if (this.menu?.isOpen) this.menu.close();
        else history.back();
      }
    });

    const headerTarget = document.getElementById('arc-header-mount');
    if (headerTarget) {
      await this.header.render(headerTarget, 'innerHTML');
    }

    // Escape / Back handling for menu
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'Backspace' || e.key === 'ArrowLeft') && this.menu?.isOpen) {
        this.menu.close();
        e.stopPropagation();
      }
    });
  }

  // ============================================================
  // CALLBACKS from Carousel
  // ============================================================
  _onBlockActivated(el) {
    document.body.classList.add('active-mode');
  }

  _onBlockDeactivated() {
    document.body.classList.remove('active-mode');
  }

  // ============================================================
  // CLOCK
  // ============================================================
  _startClock() {
    let ticksGenerated = false;

    const update = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      
      // Update dynamic header clock
      if (this.header) this.header.updateTime(hh, mm);

      // Initialize ticks and labels if not done
      const clockFace = document.getElementById('bigClockFace');
      if (clockFace && !ticksGenerated) {
        // 24-hour clock: 360 degrees / 24 hours = 15 degrees per hour
        const DEG_PER_HOUR = 15;
        
        // Remove existing ticks/labels just in case
        clockFace.querySelectorAll('.tick, .clock-label').forEach(el => el.remove());

        // Create 24 ticks
        for (let i = 0; i < 24; i++) {
          const tick = document.createElement('div');
          tick.className = 'tick';
          if (i % 6 === 0) tick.classList.add('hour-tick');
          tick.style.transform = `translateX(-50%) rotate(${i * DEG_PER_HOUR}deg)`;
          clockFace.appendChild(tick);
        }

        // Create labels
        const labels = [
          { hour: 12, text: '12' },
          { hour: 18, text: '18' },
          { hour: 0,  text: '0' },
          { hour: 6,  text: '6' }
        ];
        
        // Function to calculate angle for given hour/minute
        const getAngle = (h, m = 0) => (((h - 12 + 24) % 24) * DEG_PER_HOUR + m * 0.25) % 360;

        labels.forEach(({ hour, text }) => {
          const angleDeg = getAngle(hour);
          const rad = (angleDeg - 90) * Math.PI / 180;
          const r = 54; // radius percent
          const label = document.createElement('div');
          label.className = 'clock-label';
          label.style.left = (50 + r * Math.cos(rad)) + '%';
          label.style.top  = (50 + r * Math.sin(rad)) + '%';
          label.textContent = text;
          clockFace.appendChild(label);
        });

        ticksGenerated = true; // Mark as done
      }

      // Update big clock display
      const bigTimeDisplay = document.getElementById('bigTimeDisplay');
      if (bigTimeDisplay) bigTimeDisplay.textContent = `${hh}:${mm}`;
      
      const bigClockHand = document.getElementById('bigClockHand');
      if (bigClockHand) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        // 24-hour Hand rotation
        const rot = (((hours - 12 + 24) % 24) * 15 + minutes * 0.25) % 360;
        bigClockHand.style.transform = `translateX(-50%) rotate(${rot}deg)`;
      }
    };
    
    update();
    this.clockInterval = setInterval(update, 1000);
  }



  // ============================================================
  // THEME
  // ============================================================
  _loadTheme() {
    const saved = localStorage.getItem('eatpan-theme');
    if (saved) document.body.classList.add(`theme-${saved}`);
  }

  // ============================================================
  // MENU ACTIONS
  // ============================================================
  _handleMenuAction(action) {
    if (action === 'profile') this.carousel?.toggleProfileWedge();
    if (action === 'auth') this.carousel?.toggleAuthWedge();
  }

  // ============================================================
  // GLOBAL EXPORTS (для оберненої сумісності)
  // ============================================================
  _exposeGlobals() {
    window.appShell = this;
    window.openMenu = () => this.menu?.open();
    window.closeMenu = () => this.menu?.close();
    window.toggleClockWedge = () => this.carousel?.toggleClockWedge();
    window.toggleProfileWedge = () => this.carousel?.toggleProfileWedge();
    window.toggleAuthWedge = () => this.carousel?.toggleAuthWedge();
    window.goBack = () => history.back();
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  onDestroy() {
    clearInterval(this.clockInterval);
    this.carousel?.destroy();
    this.menu?.destroy();
  }
}
