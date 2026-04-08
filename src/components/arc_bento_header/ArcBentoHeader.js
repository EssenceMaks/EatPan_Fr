import Component from '../../core/Component.js';
import CoreAvatar from '../ui_kit/core_avatar/CoreAvatar.js';
import FluxStatBar from '../ui_kit/flux_stat_bar/FluxStatBar.js';
import FluxSegmentBar from '../ui_kit/flux_segment_bar/FluxSegmentBar.js';
import SigilDiamond from '../ui_kit/sigil_diamond/SigilDiamond.js';
import GlyphButton from '../ui_kit/glyph_button/GlyphButton.js';

export default class ArcBentoHeader extends Component {
  constructor(props = {}) {
    super(props);
    // props: { isAuth, userStats, onLogin, onClock, onMenu, onBack }
    this.state = {
      isAuth: this.props.isAuth || false,
      userStats: this.props.userStats || {
        name: 'SIR GALAHAD',
        level: 42,
        hp: { value: 3450, max: 4000 },
        mp: { value: 1200, max: 2500 },
        stamina: { filled: 5, total: 8 }
      }
    };
  }

  async template() {
    const { isAuth, userStats } = this.state;
    const { level, name, hp, mp, stamina } = userStats;

    return `
      <header class="arc-bento-header${this.state.isAuth ? ' is-auth' : ''}">
        
        <!-- ====== LEFT PANEL ====== -->
        <div class="arc-bento-full__panel arc-bento-full__left ${isAuth ? '' : 'arc-guest-mode'}" id="bh-left-btn">
          
          <div class="arc-bento-full__corner-tr"></div>
          <div class="arc-bento-full__corner-bl"></div>

          ${isAuth ? `
          <!-- AUTH MODE (Using explicit ArcBentoHeaderFull markup) -->
          <div class="arc-bento-full__avatar-zone">
            <div class="arc-bento-full__hex-outer">
              <div class="arc-bento-full__hex-gap">
                <div class="arc-bento-full__hex-avatar">
                  <i data-lucide="skull" style="width:35px;height:35px;"></i>
                </div>
              </div>
            </div>
            <div class="arc-bento-full__level-ribbon">
              <div class="arc-bento-full__level-ribbon-inner">LV ${level}</div>
            </div>
          </div>

          <div class="arc-bento-full__stats">
            <div class="arc-bento-full__name-row">
              <span class="arc-bento-full__name">${name}</span>
              <div class="arc-bento-full__badges">
                <div class="arc-bento-full__badge"><i data-lucide="crown"></i></div>
                <div class="arc-bento-full__badge" style="border-color:#52c2d6;color:#52c2d6;"><i data-lucide="gem"></i></div>
              </div>
            </div>
            
            <div class="arc-bento-full__bar">
              <span class="arc-bento-full__bar-text">${hp.value} / ${hp.max}</span>
              <div class="arc-bento-full__bar-fill arc-bento-full__bar-fill--hp" style="width:${Math.round((hp.value / hp.max) * 100)}%"></div>
            </div>

            <div class="arc-bento-full__bar">
              <span class="arc-bento-full__bar-text">${mp.value} / ${mp.max}</span>
              <div class="arc-bento-full__bar-fill arc-bento-full__bar-fill--mp" style="width:${Math.round((mp.value / mp.max) * 100)}%"></div>
            </div>

            <div class="arc-bento-full__segments">
              ${Array.from({ length: stamina.total }, (_, i) => `<div class="arc-bento-full__segment${i < stamina.filled ? ' arc-bento-full__segment--filled' : ''}"></div>`).join('')}
            </div>
          </div>
          ` : `
          <!-- GUEST MODE -->
          <div id="bh-guest-diamond"></div>
          `}
        </div>

        <!-- ====== CENTER PANEL ====== -->
        <div class="arc-bento-header__center" id="bh-clock-btn">
          <div class="bh-mini-clock">
            <div class="bh-mini-clock-hand" id="bh-mini-hand"></div>
          </div>
          <span id="bh-clock-text">--:--</span>
        </div>

        <!-- ====== RIGHT MENU ====== -->
        <div class="arc-bento-full__panel arc-bento-full__right" id="bh-menu-wrapper">
          <!-- Desktop Galtels -->
          <div class="arc-bento-full__corner-tl arc-hide-mobile"></div>
          <div class="arc-bento-full__corner-br arc-hide-mobile"></div>
          
          <!-- Mobile Galtels -->
          <div class="arc-bento-mobile-flare arc-flare-top"></div>
          <div class="arc-bento-mobile-flare arc-flare-left"></div>
          
          <div class="arc-bento-full__menu-btn" id="bh-back-btn-container" style="display:none; margin-right:10px;">
            <i data-lucide="arrow-left"></i>
          </div>
          <div class="arc-bento-full__menu-btn" id="bh-menu-btn-container">
            <i data-lucide="menu"></i>
          </div>
        </div>
      </header>
    `;
  }

  async onMount() {
    // 1. Guest diamond (only component left)
    if (!this.state.isAuth) {
      await new SigilDiamond({ icon: 'log-in', variant: 'hollow' }).render(this.$('#bh-guest-diamond'), 'innerHTML');
    }

    // 2. Bind Events
    const leftBtn = this.$('#bh-left-btn');
    if (leftBtn) {
      leftBtn.addEventListener('click', () => {
         if (this.props.onLoginClick) this.props.onLoginClick();
      });
    }
    
    this.$('#bh-clock-btn').addEventListener('click', () => {
       if (this.props.onClockClick) this.props.onClockClick();
    });
    
    this.$('#bh-menu-btn-container').addEventListener('click', (e) => {
       e.stopPropagation();
       if (this.props.onMenuClick) this.props.onMenuClick();
    });
    
    const backBtn = this.$('#bh-back-btn-container');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
         e.stopPropagation();
         if (this.props.onBackClick) this.props.onBackClick();
      });
    }

    if (window.lucide) lucide.createIcons({ root: this.element });
  }

  // API Methods
  setAuth(isAuth, userStats = null) {
    this.setState({ isAuth, userStats: userStats || this.state.userStats });
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.update();
  }

  updateTime(hh, mm) {
    const textTarget = this.$('#bh-clock-text');
    if (textTarget) textTarget.textContent = `${hh}:${mm}`;

    const hand = this.$('#bh-mini-hand');
    if (hand) {
      const hours = parseInt(hh, 10) || 0;
      const minutes = parseInt(mm, 10) || 0;
      // Calculate rotation for 24-hour style
      const rot = (((hours - 12 + 24) % 24) * 15 + minutes * 0.25) % 360;
      hand.style.transform = `translateX(-50%) rotate(${rot}deg)`;
    }
  }
}
