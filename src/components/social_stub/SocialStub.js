/**
 * SocialStub — болванка для сектора "Contacts"
 * Объединяет: подписчики, друзья, группы друзей + мини-чат.
 * CRUD через SocialService + MessageService.
 */
import Component from '../../core/Component.js';
import { SocialService, MessageService } from '../../core/ApiClient.js';

export default class SocialStub extends Component {
  constructor(props = {}) {
    super(props);
    this.followers = null;
    this.following = null;
    this.groups = null;
    this.conversations = null;
    this.allUsers = null;
    this.conversations = null;
    this._error = null;
  }

  async template() {
    return `
      <div class="stub-sector-root" style="padding:16px; height:100%; overflow-y:auto; font-family:var(--font-body, sans-serif);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-family:var(--font-title);color:var(--text-accent);font-size:1.2rem;margin:0;">
            <i data-lucide="users" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
            Контакти та Чат
          </h2>
          <button class="stub-btn stub-btn--primary" data-action="refresh">
            <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Оновити
          </button>
        </div>
        <div id="social-content"><div class="stub-loading">Завантаження...</div></div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    await this._loadData();
  }

  async _loadData() {
    const el = this.$('#social-content');
    if (!el) return;
    try {
      this.followers = await SocialService.fetchFollowers();
      this.following = await SocialService.fetchFollowing();
      this.groups = await SocialService.fetchGroups();
      this.conversations = await MessageService.fetchConversations();
      this.allUsers = await SocialService.fetchAllUsers();
      this._error = null;
    } catch (err) {
      this._error = err.message || 'Помилка API';
    }
    el.innerHTML = this._renderContent();
    if (window.lucide) lucide.createIcons({ root: el });
  }

  _renderContent() {
    if (this._error) return `<div class="stub-section"><div class="stub-json">${this._error}</div></div>`;

    const followersList = this.followers?.followers || [];
    const followingList = this.following?.following || [];
    const groupEntries = Object.entries(this.groups?.groups || {});
    const convEntries = Object.entries(this.conversations?.conversations || {});
    const allUsersList = this.allUsers?.users || [];

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="stub-section">
          <div class="stub-section__title"><i data-lucide="heart"></i> Підписники (${followersList.length})</div>
          ${followersList.length === 0
            ? '<div style="opacity:0.4;font-size:0.8rem;">Немає</div>'
            : followersList.map(uuid => `<div class="stub-row"><span style="font-size:0.75rem;">${uuid.slice(0,12)}...</span></div>`).join('')}
        </div>

        <div class="stub-section">
          <div class="stub-section__title"><i data-lucide="eye"></i> Підписки (${followingList.length})</div>
          ${followingList.length === 0
            ? '<div style="opacity:0.4;font-size:0.8rem;">Немає</div>'
            : followingList.map(uuid => `
              <div class="stub-row">
                <span style="font-size:0.75rem;">${uuid.slice(0,12)}...</span>
                <button class="stub-btn stub-btn--danger" data-action="unfollow" data-uuid="${uuid}" style="font-size:0.6rem;">✕</button>
              </div>
            `).join('')}
        </div>
      </div>

      <div class="stub-section" style="border-left:3px solid #8b4513;">
        <div class="stub-section__title"><i data-lucide="users"></i> Всі користувачі системи (${allUsersList.length})</div>
        <div style="max-height:150px; overflow-y:auto; border:1px solid #333; padding:4px;">
          ${allUsersList.length === 0
            ? '<div style="opacity:0.4;font-size:0.8rem;">Немає</div>'
            : allUsersList.map(u => `
              <div class="stub-row" style="font-size:0.8rem;">
                <span title="${u.uuid}">${u.display_name} <span style="opacity:0.5;">(${u.tier})</span></span>
                <button class="stub-btn stub-btn--primary" data-action="copy-uuid" data-uuid="${u.uuid}" style="font-size:0.6rem;">Copy ID</button>
              </div>
            `).join('')}
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="user-plus"></i> Підписатися / Додати друга</div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <input class="stub-input" id="social-target-uuid" placeholder="UUID користувача..." style="max-width:280px;" />
          <button class="stub-btn stub-btn--primary" data-action="follow">Follow</button>
          <button class="stub-btn" data-action="add-friend">Додати друга</button>
        </div>
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="users"></i> Групи друзів (${groupEntries.length})</div>
        ${groupEntries.map(([id, g]) => `
          <div class="stub-row">
            <span>${g.name}</span>
            <div style="display:flex;gap:4px;">
              <button class="stub-btn" data-action="edit-group" data-id="${id}" style="font-size:0.65rem;">Ред.</button>
              <button class="stub-btn stub-btn--danger" data-action="delete-group" data-id="${id}" style="font-size:0.65rem;">✕</button>
            </div>
          </div>
        `).join('')}
        <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
          <input class="stub-input" id="social-group-name" placeholder="Нова група..." style="max-width:160px;" />
          <button class="stub-btn" data-action="create-group">Створити</button>
        </div>
      </div>

      <div class="stub-section" style="border-left:3px solid var(--accent-primary, #8b4513);">
        <div class="stub-section__title"><i data-lucide="message-circle"></i> Діалоги (${convEntries.length})</div>
        ${convEntries.length === 0
          ? '<div style="opacity:0.4;font-size:0.8rem;">Немає діалогів</div>'
          : convEntries.map(([id, c]) => `
            <div class="stub-row" style="flex-direction:column;align-items:stretch;">
              <div style="display:flex;justify-content:space-between;">
                <span class="stub-row__label">${c.type === 'group' ? c.group_name : 'Особисті'}</span>
                <span class="stub-badge stub-badge--info">${c.message_count || 0}</span>
              </div>
              <div style="font-size:0.75rem;opacity:0.5;margin-top:2px;">${c.last_message || '—'}</div>
            </div>
          `).join('')}
      </div>

      <div class="stub-section">
        <div class="stub-section__title"><i data-lucide="send"></i> Надіслати повідомлення</div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <input class="stub-input" id="social-dm-uuid" placeholder="UUID отримувача..." style="max-width:250px;" />
          <input class="stub-input" id="social-dm-text" placeholder="Текст повідомлення..." style="max-width:200px;" />
          <button class="stub-btn stub-btn--primary" data-action="send-dm">Надіслати</button>
        </div>
      </div>
    `;
  }

  async _handleAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    try {
      if (action === 'refresh') {
        await this._loadData();
      } else if (action === 'follow') {
        const uuid = this.$('#social-target-uuid')?.value;
        if (uuid) { await SocialService.follow(uuid); await this._loadData(); }
      } else if (action === 'unfollow') {
        await SocialService.unfollow(btn.dataset.uuid);
        await this._loadData();
      } else if (action === 'add-friend') {
        const uuid = this.$('#social-target-uuid')?.value;
        if (uuid) { await SocialService.addFriend(uuid); await this._loadData(); }
      } else if (action === 'create-group') {
        const name = this.$('#social-group-name')?.value;
        if (name) { await SocialService.createGroup({ name }); await this._loadData(); }
      } else if (action === 'delete-group') {
        await SocialService.deleteGroup(btn.dataset.id);
        await this._loadData();
      } else if (action === 'edit-group') {
        const newName = prompt("Нова назва групи:");
        if (newName) {
          await SocialService.updateGroup(btn.dataset.id, { name: newName });
          await this._loadData();
        }
      } else if (action === 'copy-uuid') {
        navigator.clipboard.writeText(btn.dataset.uuid);
        alert('UUID скопійовано: ' + btn.dataset.uuid);
      } else if (action === 'send-dm') {
        const uuid = this.$('#social-dm-uuid')?.value;
        const text = this.$('#social-dm-text')?.value;
        if (uuid && text) { await MessageService.sendDM(uuid, text); await this._loadData(); }
      }
    } catch (err) {
      console.warn('[SocialStub]', err);
    }
  }
}
