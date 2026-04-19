/**
 * ProfileOverlay — Full-screen overlay with tabs
 * Tabs: Профіль | Друзі | Повідомлення | Промокоди
 * 
 * Opens from UserProfilePanel "Відкрити профіль" button.
 * Uses auth-overlay animation pattern.
 */
import Component from '../../core/Component.js';
import { ProfileService, AccountService, SocialService, MessageService, PromoService } from '../../core/ApiClient.js';

const TABS = [
  { id: 'profile', label: 'Профіль', icon: 'user' },
  { id: 'social',  label: 'Друзі',   icon: 'users' },
  { id: 'messages', label: 'Чат',     icon: 'message-circle' },
  { id: 'promo',   label: 'Промо',   icon: 'ticket' },
];

export default class ProfileOverlay extends Component {
  constructor(props = {}) {
    super(props);
    this.activeTab = 'profile';
    this.data = {};
    this._overlayEl = null;
  }

  get overlayRef() {
    let el = document.getElementById('profile-full-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'profile-full-overlay';
      el.className = 'profile-overlay';
      const main = document.getElementById('main-content') || document.body;
      main.appendChild(el);
    }
    this._overlayEl = el;
    return el;
  }

  async open() {
    const container = this.overlayRef;
    await this._loadTabData();
    await this.render(container, 'innerHTML');
    requestAnimationFrame(() => container.classList.add('is-open'));

    container.onclick = (e) => {
      if (e.target === container) this.close();
    };
  }

  close() {
    if (this._overlayEl) this._overlayEl.classList.remove('is-open');
  }

  async _loadTabData() {
    try {
      if (this.activeTab === 'profile') {
        this.data.profile = await ProfileService.getMe();
      } else if (this.activeTab === 'social') {
        this.data.followers = await SocialService.fetchFollowers();
        this.data.following = await SocialService.fetchFollowing();
        this.data.friendGroups = await SocialService.fetchGroups();
      } else if (this.activeTab === 'messages') {
        this.data.conversations = await MessageService.fetchConversations();
      } else if (this.activeTab === 'promo') {
        this.data.promoCodes = await PromoService.fetchAll();
      }
    } catch (err) {
      this.data._error = err.message || 'Помилка завантаження';
      console.warn('[ProfileOverlay] API error:', err);
    }
  }

  async template() {
    const tabsHTML = TABS.map(t => `
      <div class="profile-overlay__tab ${t.id === this.activeTab ? 'active' : ''}" data-tab="${t.id}">
        <i data-lucide="${t.icon}" style="width:14px;height:14px;"></i>
        ${t.label}
      </div>
    `).join('');

    return `
      <div class="profile-overlay__panel" onclick="event.stopPropagation()">
        <div class="profile-overlay__close" id="profile-overlay-close">
          <i data-lucide="x" style="width:18px;height:18px;"></i>
        </div>

        <div class="profile-overlay__tabs">
          ${tabsHTML}
        </div>

        <div class="profile-overlay__body">
          ${this._renderActiveTab()}
        </div>
      </div>
    `;
  }

  _renderActiveTab() {
    if (this.data._error) {
      return `<div class="stub-section">
        <div class="stub-section__title"><i data-lucide="alert-triangle"></i> Помилка</div>
        <div class="stub-json">${this.data._error}</div>
      </div>`;
    }

    switch (this.activeTab) {
      case 'profile': return this._renderProfileTab();
      case 'social':  return this._renderSocialTab();
      case 'messages': return this._renderMessagesTab();
      case 'promo':   return this._renderPromoTab();
      default: return '<div class="stub-loading">...</div>';
    }
  }

  // ============================================================
  // TAB: Profile
  // ============================================================
  _renderProfileTab() {
    const p = this.data.profile || {};
    const account = p.account || {};
    const tier = account.tier || 'free';
    const referral = account.referral_code || '';

    return `
      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="user-circle"></i> Основна інформація</div>
        <div class="stub-row"><span class="stub-row__label">UUID</span><span class="stub-row__value">${p.uuid || '—'}</span></div>
        <div class="stub-row"><span class="stub-row__label">Тір</span><span class="stub-badge stub-badge--info">${tier}</span></div>
        <div class="stub-row"><span class="stub-row__label">Реферальний код</span><span class="stub-row__value">${referral || '—'}</span></div>
        <div class="stub-row"><span class="stub-row__label">Реферальних використань</span><span class="stub-row__value">${account.referral_uses || 0}</span></div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="crown"></i> Керування тіром</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="stub-btn ${tier === 'free' ? 'stub-btn--primary' : ''}" data-action="set-tier" data-tier="free">Free</button>
          <button class="stub-btn ${tier === 'premium' ? 'stub-btn--primary' : ''}" data-action="set-tier" data-tier="premium">Premium</button>
          <button class="stub-btn ${tier === 'pro' ? 'stub-btn--primary' : ''}" data-action="set-tier" data-tier="pro">Pro</button>
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="share-2"></i> Реферал</div>
        <div style="display:flex; gap:8px;">
          <button class="stub-btn stub-btn--primary" data-action="create-referral">Створити реферальний код</button>
        </div>
        <div style="margin-top:8px;">
          <input class="stub-input" id="referral-code-input" placeholder="Введіть код для активації..." style="max-width:250px;display:inline-block;" />
          <button class="stub-btn" data-action="activate-referral" style="margin-left:4px;">Активувати</button>
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="database"></i> Повний JSON профілю</div>
        <div class="stub-json">${JSON.stringify(p, null, 2)}</div>
      </div>
    `;
  }

  // ============================================================
  // TAB: Social
  // ============================================================
  _renderSocialTab() {
    const followers = this.data.followers || {};
    const following = this.data.following || {};
    const groups = this.data.friendGroups || {};

    return `
      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="heart"></i> Підписники: ${followers.count || 0}</div>
        <div class="stub-json">${JSON.stringify(followers.followers || [], null, 2)}</div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="eye"></i> Підписки: ${following.count || 0}</div>
        <div class="stub-json">${JSON.stringify(following.following || [], null, 2)}</div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="users"></i> Групи друзів</div>
        <div class="stub-json">${JSON.stringify(groups.groups || {}, null, 2)}</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
          <input class="stub-input" id="friend-group-name" placeholder="Назва групи..." style="max-width:200px;" />
          <button class="stub-btn stub-btn--primary" data-action="create-friend-group">Створити</button>
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="user-plus"></i> Підписатися / Додати друга</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="stub-input" id="target-uuid-input" placeholder="UUID користувача..." style="max-width:280px;" />
          <button class="stub-btn" data-action="follow-user">Follow</button>
          <button class="stub-btn" data-action="add-friend">Друг</button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB: Messages
  // ============================================================
  _renderMessagesTab() {
    const convs = this.data.conversations || {};
    const list = convs.conversations || {};
    const entries = Object.entries(list);

    const convsHTML = entries.length === 0
      ? '<div class="stub-loading">Немає діалогів</div>'
      : entries.map(([id, c]) => `
        <div class="stub-row" style="flex-direction:column;align-items:stretch;">
          <div style="display:flex;justify-content:space-between;">
            <span class="stub-row__label">${c.type === 'group' ? c.group_name : 'ЛС'}</span>
            <span class="stub-badge stub-badge--info">${c.message_count || 0} повідомлень</span>
          </div>
          <div style="font-size:0.78rem;opacity:0.6;margin-top:4px;">${c.last_message || '—'}</div>
        </div>
      `).join('');

    return `
      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="message-circle"></i> Діалоги (${entries.length})</div>
        <div style="font-size:0.75rem;opacity:0.5;margin-bottom:8px;">Непрочитаних: ${convs.unread_count || 0}</div>
        ${convsHTML}
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="send"></i> Надіслати повідомлення</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input class="stub-input" id="dm-uuid-input" placeholder="UUID отримувача..." style="max-width:250px;" />
          <input class="stub-input" id="dm-text-input" placeholder="Текст..." style="max-width:200px;" />
          <button class="stub-btn stub-btn--primary" data-action="send-dm">Надіслати</button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB: Promo
  // ============================================================
  _renderPromoTab() {
    const promo = this.data.promoCodes || {};
    const codes = promo.codes || [];

    return `
      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="ticket"></i> Промокоди (${promo.count || 0})</div>
        ${codes.length === 0
          ? '<div class="stub-loading">Немає промокодів</div>'
          : codes.map(c => `
            <div class="stub-row">
              <span class="stub-row__label">${c.code}</span>
              <span class="stub-badge ${c.is_active ? 'stub-badge--ok' : 'stub-badge--error'}">${c.is_active ? 'Активний' : 'Неактивний'}</span>
            </div>
          `).join('')}
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="gift"></i> Активувати промокод</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="stub-input" id="promo-code-input" placeholder="Введіть промокод..." style="max-width:250px;" />
          <button class="stub-btn stub-btn--primary" data-action="use-promo">Активувати</button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });

    // Close
    this.$('#profile-overlay-close')?.addEventListener('click', () => this.close());

    // Tab switching
    this.$$('.profile-overlay__tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        this.activeTab = tab.dataset.tab;
        this.data._error = null;
        await this._loadTabData();
        await this._rerender();
      });
    });

    // Action buttons
    this.element.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      try {
        btn.textContent = '...';

        if (action === 'set-tier') {
          await AccountService.updateTier(btn.dataset.tier);
        } else if (action === 'create-referral') {
          await AccountService.createReferral();
        } else if (action === 'activate-referral') {
          const code = this.$('#referral-code-input')?.value;
          if (code) await AccountService.activateReferral(code);
        } else if (action === 'follow-user') {
          const uuid = this.$('#target-uuid-input')?.value;
          if (uuid) await SocialService.follow(uuid);
        } else if (action === 'add-friend') {
          const uuid = this.$('#target-uuid-input')?.value;
          if (uuid) await SocialService.addFriend(uuid);
        } else if (action === 'create-friend-group') {
          const name = this.$('#friend-group-name')?.value;
          if (name) await SocialService.createGroup({ name });
        } else if (action === 'send-dm') {
          const uuid = this.$('#dm-uuid-input')?.value;
          const text = this.$('#dm-text-input')?.value;
          if (uuid && text) await MessageService.sendDM(uuid, text);
        } else if (action === 'use-promo') {
          const code = this.$('#promo-code-input')?.value;
          if (code) await PromoService.use(code);
        }

        // Reload data after action
        await this._loadTabData();
        await this._rerender();
      } catch (err) {
        console.warn('[ProfileOverlay] Action error:', err);
        alert('Помилка: ' + (err.message || err));
        btn.textContent = action;
      }
    });
  }

  async _rerender() {
    const container = this.overlayRef;
    await this.render(container, 'innerHTML');
  }
}
