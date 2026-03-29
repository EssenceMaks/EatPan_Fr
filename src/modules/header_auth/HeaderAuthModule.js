import Component from '../../core/Component.js';
import { buildProfilePayload, getProfilePayload } from '../profile/profileData.js';

const SESSION_KEY = 'eatpan_header_auth_user';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default class HeaderAuthModule extends Component {
    constructor(props = {}) {
        super(props);
        const storedUser = this.readStoredUser();
        this.state = {
            isDrawerOpen: false,
            panel: null,
            profile: buildProfilePayload(storedUser, []),
            recoveryEmail: '',
            user: storedUser
        };
        this.globalListenersAttached = false;
        this.handleDocumentKeydown = async (event) => {
            if (event.key !== 'Escape') return;
            if (!this.state.isDrawerOpen) return;

            event.preventDefault();
            await this.closePanel();
        };
        this.profileInitialized = false;
    }

    readStoredUser() {
        try {
            const raw = window.localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    storeUser(user) {
        try {
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        } catch {}
    }

    clearStoredUser() {
        try {
            window.localStorage.removeItem(SESSION_KEY);
        } catch {}
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    buildDisplayName(email) {
        const localPart = String(email || '').split('@')[0] || 'Cook';
        return localPart
            .split(/[._-]+/)
            .filter(Boolean)
            .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join(' ') || 'Cook';
    }

    getInitials(user) {
        const source = (user?.name || user?.email || 'EP').trim();
        const parts = source.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
    }

    normalizeEmail(email) {
        return String(email ?? '').trim().toLowerCase();
    }

    isValidEmail(email) {
        return EMAIL_PATTERN.test(this.normalizeEmail(email));
    }

    applyEmailValidity(input) {
        if (!(input instanceof HTMLInputElement) || input.name !== 'email') {
            return true;
        }

        const rawValue = String(input.value ?? '');
        const normalizedEmail = this.normalizeEmail(rawValue);

        if (!normalizedEmail) {
            input.setCustomValidity('');
            return false;
        }

        if (!this.isValidEmail(normalizedEmail)) {
            input.setCustomValidity('Вкажіть коректну email-адресу.');
            return false;
        }

        input.setCustomValidity('');
        return true;
    }

    async onMount() {
        if (!this.globalListenersAttached) {
            document.addEventListener('keydown', this.handleDocumentKeydown);
            this.globalListenersAttached = true;
        }

        if (window.lucide) {
            window.lucide.createIcons({ root: this.element });
        }

        if (this.profileInitialized) return;

        this.profileInitialized = true;
        await this.loadProfileData();
    }

    getProfileIdentity() {
        return this.state.user || this.state.profile?.user || null;
    }

    async loadProfileData(shouldRefresh = true) {
        this.state.profile = await getProfilePayload(this.getProfileIdentity());

        if (window.profileModule?.setUser) {
            await window.profileModule.setUser(this.state.profile.user);
        }

        if (shouldRefresh) {
            await this.refresh();
        }
    }

    isGuestPanel(panel) {
        return ['login', 'register', 'forgot', 'forgot-sent'].includes(panel);
    }

    async animateGuestPanelOut() {
        const popover = this.element?.querySelector('.header-auth-popover--guest');
        if (!popover) return;

        popover.classList.add('header-auth-popover--leaving');
        await new Promise(resolve => window.setTimeout(resolve, 160));
    }

    async refresh() {
        await this.update({});
    }

    async openPanel(panel) {
        const nextPanel = this.state.panel === panel ? null : panel;

        if (this.state.panel && nextPanel && this.isGuestPanel(this.state.panel) && this.isGuestPanel(nextPanel)) {
            await this.animateGuestPanelOut();
        }

        this.state.isDrawerOpen = false;
        this.state.panel = nextPanel;

        if (this.state.panel !== 'forgot-sent') {
            this.state.recoveryEmail = '';
        }

        await this.refresh();
    }

    async closePanel() {
        if (!this.state.panel && !this.state.isDrawerOpen) return;

        if (this.state.panel && this.isGuestPanel(this.state.panel)) {
            await this.animateGuestPanelOut();
        }

        this.state.isDrawerOpen = false;
        this.state.panel = null;
        this.state.recoveryEmail = '';
        await this.refresh();
    }

    async toggleProfileDrawer() {
        const willOpen = !this.state.isDrawerOpen;

        if (willOpen && this.state.panel && this.isGuestPanel(this.state.panel)) {
            await this.animateGuestPanelOut();
        }

        this.state.isDrawerOpen = willOpen;
        this.state.panel = null;
        this.state.recoveryEmail = '';

        if (willOpen) {
            await this.loadProfileData(false);
        }

        await this.refresh();
    }

    async completeAuth(user) {
        this.state.user = user;
        this.state.isDrawerOpen = false;
        this.state.panel = null;
        this.state.recoveryEmail = '';
        this.storeUser(user);
        await this.loadProfileData(false);
        await this.refresh();
    }

    async logout() {
        this.state.user = null;
        this.state.isDrawerOpen = false;
        this.state.panel = null;
        this.state.recoveryEmail = '';
        this.clearStoredUser();
        await this.loadProfileData(false);
        await this.refresh();
    }

    renderGuestPanel(mode) {
        const isRegister = mode === 'register';
        const isForgot = mode === 'forgot';
        const title = isRegister
            ? 'Створити акаунт'
            : isForgot
                ? 'Відновити доступ'
                : 'Увійти в книгу';
        const ariaLabel = isRegister
            ? 'Форма реєстрації'
            : isForgot
                ? 'Форма відновлення доступу'
                : 'Форма авторизації';
        const submitLabel = isRegister
            ? 'Створити профіль'
            : isForgot
                ? 'Відновити доступ'
                : 'Увійти';
        const note = isForgot
            ? 'Фронтенд-демо: тут буде сценарій відновлення доступу без реальної відправки листа.'
            : 'Фронтенд-демо: після відправки форми бекенд поки не викликається.';

        return `
            <div class="header-auth-popover header-auth-popover--guest" data-auth-mode="${mode}" role="dialog" aria-modal="false" aria-label="${ariaLabel}">
                <div class="header-auth-popover-head">
                    <div class="header-auth-heading">
                        <span class="header-auth-kicker">Kitchen Pass</span>
                        <h3 class="header-auth-title">${title}</h3>
                    </div>
                    <button class="header-auth-close" type="button" data-auth-close aria-label="Закрити форму">×</button>
                </div>
                <form class="header-auth-form-panel" data-auth-form="${mode}">
                    ${isRegister ? `
                        <label class="header-auth-field">
                            <span class="header-auth-label">Ім'я</span>
                            <input class="header-auth-input" type="text" name="name" placeholder="Ваше ім'я" autocomplete="name" required />
                        </label>
                    ` : ''}
                    <label class="header-auth-field">
                        <span class="header-auth-label">Email</span>
                        <input class="header-auth-input" type="email" name="email" placeholder="name@example.com" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" required />
                    </label>
                    ${isForgot ? '' : `
                        <label class="header-auth-field">
                            <span class="header-auth-label">Пароль</span>
                            <input class="header-auth-input" type="password" name="password" placeholder="••••••••" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required />
                        </label>
                    `}
                    ${isRegister ? `
                        <label class="header-auth-field">
                            <span class="header-auth-label">Повторіть пароль</span>
                            <input class="header-auth-input" type="password" name="confirmPassword" placeholder="••••••••" autocomplete="new-password" required />
                        </label>
                    ` : ''}
                    ${mode === 'login' ? `
                        <button class="header-auth-switch header-auth-switch--subtle" type="button" data-auth-switch="forgot">
                            Забули пароль?
                        </button>
                    ` : ''}
                    <div class="header-auth-actions-row">
                        <button class="header-auth-submit" type="submit">${submitLabel}</button>
                    </div>
                    ${isForgot ? `
                        <button class="header-auth-switch" type="button" data-auth-switch="login">
                            Назад до входу
                        </button>
                    ` : `
                        <button class="header-auth-switch" type="button" data-auth-switch="${isRegister ? 'login' : 'register'}">
                            ${isRegister ? 'Уже є акаунт? Увійти' : 'Ще немає акаунта? Реєстрація'}
                        </button>
                    `}
                    <p class="header-auth-note">${note}</p>
                </form>
            </div>
        `;
    }

    renderRecoverySuccessPanel() {
        return `
            <div class="header-auth-popover header-auth-popover--guest header-auth-popover--success" data-auth-mode="forgot-sent" role="dialog" aria-modal="false" aria-label="Підтвердження відновлення доступу">
                <div class="header-auth-popover-head">
                    <div class="header-auth-heading">
                        <span class="header-auth-kicker">Kitchen Pass</span>
                        <h3 class="header-auth-title">Лист майже в дорозі</h3>
                    </div>
                    <button class="header-auth-close" type="button" data-auth-close aria-label="Закрити форму">×</button>
                </div>
                <div class="header-auth-success-panel">
                    <p class="header-auth-note">Ми підготували інструкцію для <strong>${this.escapeHtml(this.state.recoveryEmail)}</strong>. У демо-режимі лист не надсилається, але сценарій відновлення вже змодельовано.</p>
                    <div class="header-auth-actions-row">
                        <button class="header-auth-submit" type="button" data-auth-switch="login">Повернутися до входу</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderProfileDrawer() {
        const profile = this.state.profile;
        const user = profile.user;

        return `
            <div class="header-profile-layer">
                <div class="header-profile-backdrop" data-profile-drawer-close></div>
                <aside class="header-profile-drawer" role="dialog" aria-modal="false" aria-label="Панель профілю користувача">
                    <div class="header-profile-drawer-head">
                        <div class="header-profile-drawer-avatar">${this.escapeHtml(user.initials)}</div>
                        <div class="header-profile-drawer-copy">
                            <span class="header-auth-kicker">Kitchen Profile</span>
                            <strong class="header-auth-user-name">${this.escapeHtml(user.name)}</strong>
                            <span class="header-profile-drawer-handle">${this.escapeHtml(user.handle)}</span>
                            <span class="header-auth-user-email">${this.escapeHtml(user.email)}</span>
                        </div>
                        <button class="header-auth-close" type="button" data-profile-drawer-close aria-label="Закрити профіль">×</button>
                    </div>
                    <p class="header-profile-drawer-bio">${this.escapeHtml(user.bio)}</p>
                    <div class="header-profile-stat-grid">
                        ${profile.stats.map(stat => `
                            <div class="header-profile-stat-card">
                                <span class="header-profile-stat-value">${this.escapeHtml(stat.value)}</span>
                                <span class="header-profile-stat-label">${this.escapeHtml(stat.label)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="header-profile-drawer-highlights">
                        ${profile.highlights.slice(0, 2).map(item => `
                            <p>${this.escapeHtml(item)}</p>
                        `).join('')}
                    </div>
                    <div class="header-profile-drawer-actions">
                        <button class="header-auth-submit" type="button" data-profile-open-page>Відкрити профіль</button>
                        <button class="header-auth-trigger" type="button" data-profile-drawer-close-button>Закрити</button>
                        <button class="header-auth-trigger" type="button" data-auth-logout>Вийти</button>
                    </div>
                </aside>
            </div>
        `;
    }

    template() {
        const profileUser = this.state.profile.user;

        return `
            <div class="header-auth-root">
                <div class="header-auth-shell">
                    <div class="header-auth-buttons">
                        <button class="header-auth-avatar header-auth-avatar--dev" type="button" data-profile-drawer-toggle aria-label="Відкрити профіль користувача">
                            ${this.escapeHtml(profileUser.initials)}
                        </button>
                        <button class="header-auth-trigger header-auth-trigger--primary" type="button" data-auth-open="login">Вхід</button>
                    </div>
                    ${this.state.panel === 'login' ? this.renderGuestPanel('login') : ''}
                    ${this.state.panel === 'register' ? this.renderGuestPanel('register') : ''}
                    ${this.state.panel === 'forgot' ? this.renderGuestPanel('forgot') : ''}
                    ${this.state.panel === 'forgot-sent' ? this.renderRecoverySuccessPanel() : ''}
                </div>
                ${this.state.isDrawerOpen ? this.renderProfileDrawer() : ''}
            </div>
        `;
    }

    attachEvents() {
        this.element.addEventListener('click', async (event) => {
            const openTrigger = event.target.closest('[data-auth-open]');
            if (openTrigger) {
                await this.openPanel(openTrigger.dataset.authOpen);
                return;
            }

            const switchTrigger = event.target.closest('[data-auth-switch]');
            if (switchTrigger) {
                await this.openPanel(switchTrigger.dataset.authSwitch);
                return;
            }

            if (event.target.closest('[data-auth-close]')) {
                await this.closePanel();
                return;
            }

            if (event.target.closest('[data-profile-drawer-toggle]')) {
                await this.toggleProfileDrawer();
                return;
            }

            if (event.target.closest('[data-profile-drawer-close]')) {
                this.state.isDrawerOpen = false;
                await this.refresh();
                return;
            }

            if (event.target.closest('[data-profile-drawer-close-button]')) {
                await this.closePanel();
                return;
            }

            if (event.target.closest('[data-profile-open-page]')) {
                await this.closePanel();
                window.openProfilePage?.();
                return;
            }

            if (event.target.closest('[data-auth-logout]')) {
                await this.logout();
            }
        });

        this.element.addEventListener('input', (event) => {
            const emailInput = event.target.closest('input[name="email"]');
            if (emailInput) {
                this.applyEmailValidity(emailInput);
            }
        });

        this.element.addEventListener('submit', async (event) => {
            const form = event.target.closest('[data-auth-form]');
            if (!form) return;

            event.preventDefault();

            const emailInput = form.querySelector('input[name="email"]');
            if (emailInput) {
                this.applyEmailValidity(emailInput);
            }

            if (!form.reportValidity()) return;

            const formData = new FormData(form);
            const mode = form.dataset.authForm;
            const email = this.normalizeEmail(formData.get('email'));

            if (!email) return;

            if (mode === 'forgot') {
                this.state.recoveryEmail = email;
                this.state.panel = 'forgot-sent';
                this.state.isDrawerOpen = false;
                await this.refresh();
                return;
            }

            const password = String(formData.get('password') || '').trim();

            if (!password) return;

            if (mode === 'register') {
                const name = String(formData.get('name') || '').trim();
                const confirmPassword = String(formData.get('confirmPassword') || '').trim();

                if (password !== confirmPassword) {
                    window.alert('Паролі не співпадають.');
                    return;
                }

                await this.completeAuth({
                    name: name || this.buildDisplayName(email),
                    email
                });
                return;
            }

            await this.completeAuth({
                name: this.buildDisplayName(email),
                email
            });
        });
    }
}
