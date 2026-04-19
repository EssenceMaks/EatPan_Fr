import Component from '../../core/Component.js';
import { supabase } from '../../core/supabaseClient.js';
import { ProfileService } from '../../core/ApiClient.js';
import ProfileOverlay from '../profile_overlay/ProfileOverlay.js';

export default class UserProfilePanel extends Component {
  constructor(props) {
    super(props);
    this.onLogoutSuccess = props.onLogoutSuccess || (() => {});
    this.profileOverlay = new ProfileOverlay();
    
    this.userData = {
      name: 'HERO',
      email: '',
      avatarUrl: null,
      savedRecipes: 0,
      createdRecipes: 0,
      contacts: 0,
      tier: 'free',
      referralCode: '',
    };
  }

  get overlayRef() {
    let el = document.getElementById('user-profile-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'user-profile-overlay';
      el.className = 'auth-overlay';
      const main = document.getElementById('main-content') || document.body;
      main.appendChild(el);
    }
    return el;
  }

  async template() {
    return `
      <div class="auth-panel" onclick="event.stopPropagation()">
        <!-- Decorative Corners -->
        <div class="auth-panel__corner-tr"></div>
        <div class="auth-panel__corner-br"></div>
        
        <!-- Header: Close Button -->
        <div class="auth-panel__header" style="justify-content: flex-end;">
          <div class="auth-panel__close" id="profile-btn-close">
            <i data-lucide="x"></i>
          </div>
        </div>

        <!-- Scrollable Content View -->
        <div class="auth-panel__content" style="justify-content: flex-start; padding-top: 40px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: rgba(var(--ink-rgb), 0.1); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--ink); border: 2px solid var(--ink); overflow: hidden;">
              ${this.userData.avatarUrl 
                ? `<img src="${this.userData.avatarUrl}" alt="Avatar" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
                : `<i data-lucide="user"></i>`
              }
            </div>
            <h2 class="auth-form-title" style="margin-bottom: 5px; font-size: 1.6rem;">${this.userData.name}</h2>
            <p style="font-family: var(--font-body); opacity: 0.7; color: var(--ink); font-size: 0.9rem;">${this.userData.email}</p>
            <div style="margin-top: 8px;">
              <span class="stub-badge stub-badge--info" style="font-size: 0.7rem;">${this.userData.tier.toUpperCase()}</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(var(--ink-rgb), 0.2); padding-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 10px; color: var(--ink); font-family: var(--font-title); font-weight: 600;">
                <i data-lucide="heart" style="width: 18px; height: 18px;"></i>
                <span>Збережені Рецепти</span>
              </div>
              <span style="font-family: var(--font-display); font-size: 1.2rem; color: var(--ink);">${this.userData.savedRecipes}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(var(--ink-rgb), 0.2); padding-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 10px; color: var(--ink); font-family: var(--font-title); font-weight: 600;">
                <i data-lucide="chef-hat" style="width: 18px; height: 18px;"></i>
                <span>Створені Рецепти</span>
              </div>
              <span style="font-family: var(--font-display); font-size: 1.2rem; color: var(--ink);">${this.userData.createdRecipes}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(var(--ink-rgb), 0.2); padding-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 10px; color: var(--ink); font-family: var(--font-title); font-weight: 600;">
                <i data-lucide="book-open" style="width: 18px; height: 18px;"></i>
                <span>Книга Контактів</span>
              </div>
              <span style="font-family: var(--font-display); font-size: 1.2rem; color: var(--ink);">${this.userData.contacts}</span>
            </div>

          </div>

          <!-- Open Full Profile Button -->
          <button class="auth-btn-primary" id="btn-open-profile" style="width: 100%; margin-bottom: 12px; border-color: var(--ink); color: var(--ink); background: rgba(var(--ink-rgb), 0.06);">
            <i data-lucide="user-circle" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>
            Відкрити профіль
          </button>

          <div style="margin-top: auto;">
             <button class="auth-btn-primary" id="btn-logout" style="width: 100%; border-color: rgba(180,30,30,0.8); color: rgba(180,30,30,0.8); background: transparent;">
               Вийти з акаунту
             </button>
          </div>

        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });

    const closeBtn = this.element.querySelector('#profile-btn-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Open Full Profile Overlay
    const openProfileBtn = this.element.querySelector('#btn-open-profile');
    if (openProfileBtn) {
      openProfileBtn.addEventListener('click', () => {
        this.close();
        this.profileOverlay.open();
      });
    }

    const btnLogout = this.element.querySelector('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        btnLogout.textContent = "Виходимо...";
        await supabase.auth.signOut();
        this.close();
        this.onLogoutSuccess();
      });
    }
  }

  async softReRender() {
    if (this.overlayRef) {
      this.overlayRef.className = 'auth-overlay';
      await this.render(this.overlayRef, 'innerHTML');
    }
  }

  async open() {
    // Pull Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      this.userData.email = session.user.email;
      this.userData.name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'HERO';
      this.userData.avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
    }

    // Try to fetch profile data from API
    try {
      const profile = await ProfileService.getMe();
      if (profile) {
        const account = profile.account || {};
        this.userData.tier = account.tier || 'free';
        this.userData.referralCode = account.referral_code || '';
        // Count data
        const tasks = profile.tasks || {};
        const social = profile.social || {};
        this.userData.contacts = (social.followers || []).length + Object.keys(social.friends || {}).length;
      }
    } catch (err) {
      console.warn('[UserProfilePanel] Could not load profile:', err);
    }

    await this.softReRender();
    
    this.overlayRef.onclick = (e) => {
      if (e.target === this.overlayRef) this.close();
    };
    
    requestAnimationFrame(() => {
      this.overlayRef.classList.add('is-open');
    });
  }

  close() {
    this.overlayRef.classList.remove('is-open');
  }
}
