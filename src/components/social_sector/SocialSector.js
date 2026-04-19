import Component from '../../core/Component.js';
import { SocialService, MessageService } from '../../core/ApiClient.js';

export default class SocialSector extends Component {
  constructor(props = {}) {
    super(props);
    this.followers = null;
    this.following = null;
    this.groups = null;
    this.conversations = null;
    this.allUsers = null;
    this._error = null;
    
    this.activeTab = 'all'; // 'all', 'friends', 'groups', 'chats'
  }

  async template() {
    return `
      <div class="social-sector" style="height: 100%; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div class="social-header">
          <div class="social-title">
             <i data-lucide="shield"></i> Альянси та Зв'язки
          </div>
          <button class="social-btn social-btn--refresh" data-action="refresh">
            <i data-lucide="refresh-cw"></i> Оновити
          </button>
        </div>

        <!-- TABS -->
        <div class="social-tabs">
          <div class="social-tab ${this.activeTab === 'all' ? 'active' : ''}" data-action="tab" data-tab="all">Глобальна Мережа</div>
          <div class="social-tab ${this.activeTab === 'friends' ? 'active' : ''}" data-action="tab" data-tab="friends">Союзники</div>
          <div class="social-tab ${this.activeTab === 'groups' ? 'active' : ''}" data-action="tab" data-tab="groups">Гільдії</div>
          <div class="social-tab ${this.activeTab === 'chats' ? 'active' : ''}" data-action="tab" data-tab="chats">Пошта</div>
        </div>

        <!-- CONTENT AREA -->
        <div class="social-content scrollbar-diamond">
          ${this._error ? `<div class="social-error">${this._error}</div>` : ''}
          ${!this.allUsers ? `<div class="social-loading">Встановлення зв'язку...</div>` : this._renderActiveTab()}
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
    this.element.addEventListener('click', (e) => this._handleAction(e));
    await this._loadData();
  }

  async _loadData() {
    try {
      this.followers = await SocialService.fetchFollowers();
      this.following = await SocialService.fetchFollowing();
      this.groups = await SocialService.fetchGroups();
      this.conversations = await MessageService.fetchConversations();
      this.allUsers = await SocialService.fetchAllUsers();
      this._error = null;
    } catch (err) {
      this._error = err.message || 'Втрачено зв\'язок з сервером';
    }
    
    const contentEl = this.$('.social-content');
    if (contentEl) {
        contentEl.innerHTML = this._renderActiveTab();
        if (window.lucide) lucide.createIcons({ root: contentEl });
    } else {
        this.render(this.element.parentElement, 'replace');
    }
  }

  _renderActiveTab() {
      if (this.activeTab === 'all') return this._renderAllUsers();
      if (this.activeTab === 'friends') return this._renderFriends();
      if (this.activeTab === 'groups') return this._renderGroups();
      if (this.activeTab === 'chats') return this._renderChats();
      return '';
  }

  _renderAllUsers() {
      const users = this.allUsers?.users || [];
      const followingList = this.following?.following || [];
      
      if (users.length === 0) return `<div class="social-empty">Мережа порожня.</div>`;

      return `
        <div class="social-grid">
            ${users.map(u => {
                const isFollowing = followingList.includes(u.uuid);
                const tierColor = u.tier === 'Premium' ? 'var(--c-accent-gold)' : '#ccc';
                
                return `
                <div class="social-card">
                    <div class="social-card__avatar" style="border-color: ${tierColor}">
                        ${u.avatar_url ? `<img src="${u.avatar_url}" />` : `<i data-lucide="user"></i>`}
                    </div>
                    <div class="social-card__info">
                        <div class="social-card__name">${u.display_name}</div>
                        <div class="social-card__tier" style="color: ${tierColor}">${u.tier}</div>
                    </div>
                    <div class="social-card__actions">
                        ${isFollowing 
                            ? `<button class="social-btn social-btn--danger" data-action="unfollow" data-uuid="${u.uuid}">Відписатись</button>`
                            : `<button class="social-btn social-btn--primary" data-action="follow" data-uuid="${u.uuid}">Додати</button>`
                        }
                    </div>
                </div>
                `;
            }).join('')}
        </div>
      `;
  }

  _renderFriends() {
      return `<div class="social-empty">Тут будуть твої союзники та підписники.</div>`;
  }

  _renderGroups() {
      return `<div class="social-empty">Тут будуть твої гільдії (Групи друзів).</div>`;
  }

  _renderChats() {
      return `<div class="social-empty">Тут буде твоя поштова скринька (Діалоги).</div>`;
  }

  async _handleAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    
    if (action === 'tab') {
        this.activeTab = btn.dataset.tab;
        this.render(this.element.parentElement, 'replace');
        return;
    }
    
    try {
      if (action === 'refresh') {
        await this._loadData();
      } else if (action === 'follow') {
        await SocialService.follow(btn.dataset.uuid);
        await this._loadData();
      } else if (action === 'unfollow') {
        await SocialService.unfollow(btn.dataset.uuid);
        await this._loadData();
      }
    } catch (err) {
      console.warn('[SocialSector]', err);
    }
  }
}
