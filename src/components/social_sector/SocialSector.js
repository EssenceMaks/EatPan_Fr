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
          <div class="social-tab ${this.activeTab === 'all' ? 'active' : ''}" data-action="tab" data-tab="all">Всі контакти</div>
          <div class="social-tab ${this.activeTab === 'friends' ? 'active' : ''}" data-action="tab" data-tab="friends">Друзі</div>
          <div class="social-tab ${this.activeTab === 'subs' ? 'active' : ''}" data-action="tab" data-tab="subs">Підписки</div>
          <div class="social-tab ${this.activeTab === 'messages' ? 'active' : ''}" data-action="tab" data-tab="messages">Повідомлення</div>
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
      if (this.activeTab === 'subs') return this._renderSubs();
      if (this.activeTab === 'messages') return this._renderMessages();
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
      const users = this.allUsers?.users || [];
      const followingList = this.following?.following || [];
      
      const friends = users.filter(u => followingList.includes(u.uuid));
      if (friends.length === 0) return `<div class="social-empty">У вас немає союзників.</div>`;

      return `
        <div class="social-grid">
            ${friends.map(u => {
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
                        <button class="social-btn social-btn--danger" data-action="unfollow" data-uuid="${u.uuid}">Видалити</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
      `;
  }

  _renderSubs() {
      const users = this.allUsers?.users || [];
      const followersList = this.followers?.followers || [];
      const followingList = this.following?.following || [];
      
      const followers = users.filter(u => followersList.includes(u.uuid));
      
      if (followers.length === 0) return `<div class="social-empty">У вас немає підписників.</div>`;

      return `
        <div class="social-grid">
            ${followers.map(u => {
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
                            : `<button class="social-btn social-btn--primary" data-action="follow" data-uuid="${u.uuid}">Підписатись</button>`
                        }
                    </div>
                </div>
                `;
            }).join('')}
        </div>
      `;
  }

  _renderMessages() {
      const convs = this.conversations?.conversations || {};
      const entries = Object.entries(convs);
      
      if (entries.length === 0) return `<div class="social-empty">У вас немає повідомлень.</div>`;

      return `
        <div class="social-grid">
            ${entries.map(([cid, conv]) => {
                const title = conv.type === 'group' ? conv.group_name : 'Приватний діалог';
                return `
                <div class="social-card" style="width:100%; flex-direction:row;">
                    <div class="social-card__avatar" style="border-color: #888">
                        <i data-lucide="${conv.type === 'group' ? 'users' : 'message-square'}"></i>
                    </div>
                    <div class="social-card__info" style="flex:1;">
                        <div class="social-card__name">${title}</div>
                        <div class="social-card__tier" style="color: #ccc">${conv.last_message || 'Немає повідомлень'}</div>
                    </div>
                    <div class="social-card__actions">
                        <button class="social-btn social-btn--primary" data-action="open-chat" data-uuid="${cid}">Відкрити</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
      `;
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
