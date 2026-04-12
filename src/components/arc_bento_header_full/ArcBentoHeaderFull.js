import Component from '../../core/Component.js';

/**
 * ArcBentoHeaderFull — EXACT replica of user_ref_v3.html
 *
 * Structure:
 *   [rpg-header wrapper]
 *     [LEFT bento-panel] — avatar + stats
 *       corner-top-right (galtel)
 *       corner-bottom-left (galtel)
 *       [avatar-zone] — hex-avatar + level-ribbon
 *       [stats] — name, badges, HP bar, MP bar, stamina segments
 *     [RIGHT bento-panel] — menu button
 *       corner-top-left (galtel)
 *       corner-bottom-right (galtel)
 *       [menu-btn]
 */
export default class ArcBentoHeaderFull extends Component {
  constructor(props = {}) {
    super(props);
  }

  async template() {
    const name    = this.props.name    || 'SIR GALAHAD';
    const level   = this.props.level   ?? 42;
    const hp      = this.props.hp      || { value: 3450, max: 4000 };
    const mp      = this.props.mp      || { value: 1200, max: 2500 };
    const stamina = this.props.stamina || { filled: 5, total: 8 };
    const hpPct   = Math.round((hp.value / hp.max) * 100);
    const mpPct   = Math.round((mp.value / mp.max) * 100);

    // Stamina segments
    const segments = Array.from({ length: stamina.total }, (_, i) =>
      `<div class="arc-bento-full__segment${i < stamina.filled ? ' arc-bento-full__segment--filled' : ''}"></div>`
    ).join('');

    return `
      <div class="arc-bento-full">

        <!-- ===== LEFT PANEL (User + Stats) ===== -->
        <div class="arc-bento-full__panel arc-bento-full__left">
          <!-- Galtel corners -->
          <div class="arc-bento-full__corner-tr"></div>
          <div class="arc-bento-full__corner-bl"></div>

          <!-- Avatar + Level Ribbon -->
          <div class="arc-bento-full__avatar-zone">
            <div class="arc-bento-full__hex-outer">
              <div class="arc-bento-full__hex-gap">
                <div class="arc-bento-full__hex-avatar">
                  <i data-lucide="user" style="width:35px;height:35px;"></i>
                </div>
              </div>
            </div>
            <!-- Level ribbon extends below the panel -->
            <div class="arc-bento-full__level-ribbon">
              <div class="arc-bento-full__level-ribbon-inner">LV ${level}</div>
            </div>
          </div>

          <!-- Stats -->
          <div class="arc-bento-full__stats">
            <div class="arc-bento-full__name-row">
              <span class="arc-bento-full__name">${name}</span>
              <div class="arc-bento-full__badges">
                <div class="arc-bento-full__badge">
                  <i data-lucide="crown"></i>
                </div>
                <div class="arc-bento-full__badge" style="border-color:#52c2d6;color:#52c2d6;">
                  <i data-lucide="gem"></i>
                </div>
              </div>
            </div>

            <!-- HP Bar -->
            <div class="arc-bento-full__bar">
              <span class="arc-bento-full__bar-text">${hp.value} / ${hp.max}</span>
              <div class="arc-bento-full__bar-fill arc-bento-full__bar-fill--hp" style="width:${hpPct}%"></div>
            </div>

            <!-- MP Bar -->
            <div class="arc-bento-full__bar">
              <span class="arc-bento-full__bar-text">${mp.value} / ${mp.max}</span>
              <div class="arc-bento-full__bar-fill arc-bento-full__bar-fill--mp" style="width:${mpPct}%"></div>
            </div>

            <!-- Stamina Segments -->
            <div class="arc-bento-full__segments">${segments}</div>
          </div>
        </div>

        <!-- ===== RIGHT PANEL (Menu) ===== -->
        <div class="arc-bento-full__panel arc-bento-full__right">
          <!-- Galtel corners -->
          <div class="arc-bento-full__corner-tl"></div>
          <div class="arc-bento-full__corner-br"></div>

          <!-- Menu button -->
          <div class="arc-bento-full__menu-btn">
            <i data-lucide="menu"></i>
          </div>
        </div>

      </div>
    `;
  }

  async onMount() {
    // Use MutationObserver to modify icon sizes after lucide creates them
    const observer = new MutationObserver((mutations) => {
      const badgeIcons = this.element.querySelectorAll('.arc-bento-full__badge svg');
      badgeIcons.forEach(svg => {
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.style.width = '14px';
        svg.style.height = '14px';
      });
    });

    observer.observe(this.element, {
      childList: true,
      subtree: true
    });

    // Initial check in case icons already exist
    const badgeIcons = this.element.querySelectorAll('.arc-bento-full__badge svg');
    badgeIcons.forEach(svg => {
      svg.setAttribute('width', '14');
      svg.setAttribute('height', '14');
      svg.style.width = '14px';
      svg.style.height = '14px';
    });
  }
}
