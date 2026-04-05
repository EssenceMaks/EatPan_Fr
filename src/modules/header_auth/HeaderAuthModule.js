import Component from '../../core/Component.js';
import { buildProfilePayload, getProfilePayload } from '../profile/profileData.js';
import { IS_LOCAL } from '../../api/RecipeService.js';

//const SUPABASE_URL = IS_LOCAL
//    ? 'http://localhost:6500'
//    : 'https://pkdnyonrejptotlpzclq.supabase.co'; // Cloud Supabase
// Default Anon Key for local instances (update if necessary for Prod)
//const SUPABASE_ANON_KEY = IS_LOCAL 
//    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE' 
//    : 'sb_publishable_84gbx1XeHzOHwsM9oJEeYg_bDtU_7Zh'; // Publishable Key for Cloud Supabase


const SUPABASE_URL = 'https://pkdnyonrejptotlpzclq.supabase.co'; // Завжди Cloud Supabase для централізованої автентифікації

// Publishable Key for Cloud Supabase
const SUPABASE_ANON_KEY = 'sb_publishable_84gbx1XeHzOHwsM9oJEeYg_bDtU_7Zh';




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
        this.htmlCache = {};
    }

    async loadHtml(path) {
        if (this.htmlCache[path]) return this.htmlCache[path];
        try {
            const res = await fetch(path);
            const text = await res.text();
            this.htmlCache[path] = text;
            return text;
        } catch (e) {
            console.error('Failed to load HTML from ' + path, e);
            return '';
        }
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
        } catch { }
    }

    clearStoredUser() {
        try {
            window.localStorage.removeItem(SESSION_KEY);
        } catch { }
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
        if (!window.supabase) {
            this.state.profile = await getProfilePayload(this.getProfileIdentity());
            if (shouldRefresh) await this.refresh();
            return;
        }

        const { data: { session }, error } = await window.supabase.auth.getSession();
        if (session && session.user) {
            const userWithToken = {
                ...session.user,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                access_token: session.access_token,
                refresh_token: session.refresh_token
            };
            this.state.user = userWithToken;
            this.storeUser(userWithToken);
        } else {
            this.state.user = null;
            this.clearStoredUser();
        }

        this.state.profile = await getProfilePayload(this.getProfileIdentity());

        if (window.profileModule?.setUser) {
            await window.profileModule.setUser(this.state.profile.user);
        }

        if (shouldRefresh) {
            await this.refresh();
        }
    }

    isGuestPanel(panel) {
        return ['login', 'register', 'forgot', 'forgot-sent', 'welcome'].includes(panel);
    }

    async animateGuestPanelOut() {
        const popover = this.element?.querySelector('.header-auth-popover--guest');
        if (!popover) return;

        popover.classList.add('header-auth-popover--leaving');
        await new Promise(resolve => window.setTimeout(resolve, 160));
    }

    async refresh() {
        await this.update({});
        if (window.lucide) {
            window.lucide.createIcons({ root: this.element });
        }
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

    async renderGuestPanel(mode) {
        const fullHtml = await this.loadHtml('./src/modules/header_auth/auth_forms.html');
        const div = document.createElement('div');
        div.innerHTML = fullHtml;
        const tpl = div.querySelector(`#tpl-${mode}`);
        return tpl ? tpl.innerHTML : '';
    }

    async renderRecoverySuccessPanel() {
        const fullHtml = await this.loadHtml('./src/modules/header_auth/auth_forms.html');
        const div = document.createElement('div');
        div.innerHTML = fullHtml;
        const tpl = div.querySelector('#tpl-forgot-sent');
        if (!tpl) return '';
        let html = tpl.innerHTML;
        return html.replace('<strong id="forgot-sent-email"></strong>', `<strong>${this.escapeHtml(this.state.recoveryEmail)}</strong>`);
    }

    async renderProfileDrawer() {
        let html = await this.loadHtml('./src/modules/header_auth/profile_drawer.html');
        const profile = this.state.profile;
        const user = profile.user;

        html = html.replace('{{INITIALS}}', this.escapeHtml(user.initials));
        html = html.replace('{{NAME}}', this.escapeHtml(user.name));
        html = html.replace('{{HANDLE}}', this.escapeHtml(user.handle));
        html = html.replace('{{EMAIL}}', this.escapeHtml(user.email));
        html = html.replace('{{BIO}}', this.escapeHtml(user.bio));

        const statsHtml = profile.stats.map(stat => `
            <div class="header-profile-stat-card">
                <span class="header-profile-stat-value">${this.escapeHtml(stat.value)}</span>
                <span class="header-profile-stat-label">${this.escapeHtml(stat.label)}</span>
            </div>
        `).join('');

        const highlightsHtml = profile.highlights.slice(0, 2).map(item => `
            <p>${this.escapeHtml(item)}</p>
        `).join('');

        html = html.replace('<!-- STATS_PLACEHOLDER -->', statsHtml);
        html = html.replace('<!-- HIGHLIGHTS_PLACEHOLDER -->', highlightsHtml);

        return html;
    }

    async template() {
        const profileUser = this.state.profile.user;
        const isAuthenticated = !!this.state.user;

        let panelHtml = '';
        if (this.state.panel === 'login') panelHtml = await this.renderGuestPanel('login');
        else if (this.state.panel === 'register') panelHtml = await this.renderGuestPanel('register');
        else if (this.state.panel === 'forgot') panelHtml = await this.renderGuestPanel('forgot');
        else if (this.state.panel === 'forgot-sent') panelHtml = await this.renderRecoverySuccessPanel();
        else if (this.state.panel === 'welcome') panelHtml = await this.renderGuestPanel('welcome');

        let drawerHtml = '';
        if (this.state.isDrawerOpen) {
            drawerHtml = await this.renderProfileDrawer();
        }

        const avatarBorder = isAuthenticated ? 'border: 2px solid #578c54;' : '';
        const activeDotHtml = isAuthenticated
            ? '<span style="position: absolute; bottom: 0px; right: -2px; width: 10px; height: 10px; background-color: #578c54; border-radius: 50%; border: 2px solid #f4f3ed; z-index: 2;"></span>'
            : '';

        const loginBtnStyle = isAuthenticated
            ? 'background-color: #d1cfc7; color: #aba79d; border-color: #d1cfc7;'
            : '';

        return `
            <div class="header-auth-root">
                <div class="header-auth-shell">
                    <div class="header-auth-buttons">
                        ${isAuthenticated ? `
                            <div style="position: relative; display: inline-flex;">
                                <button class="header-auth-avatar header-auth-avatar--dev" type="button" style="${avatarBorder}" data-profile-drawer-toggle aria-label="Відкрити профіль користувача">
                                    ${this.escapeHtml(profileUser.initials)}
                                </button>
                                ${activeDotHtml}
                            </div>
                        ` : `
                            <button class="header-auth-avatar header-auth-avatar--dev" type="button" data-auth-open="login" aria-label="Увійти">
                                <i data-lucide="log-in" style="width: 20px; height: 20px;"></i>
                            </button>
                        `}
                    </div>
                    ${panelHtml}
                </div>
                ${drawerHtml}
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

                try {
                    const currentUrl = window.location.origin + window.location.pathname;
                    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(currentUrl)}`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password, data: { name } })
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        window.alert('Помилка реєстрації: ' + (data.msg || data.error_description || 'Невідома помилка'));
                        return;
                    }

                    if (data.session) {
                        await this.completeAuth({
                            name: name || this.buildDisplayName(email),
                            email: email,
                            access_token: data.session.access_token,
                            refresh_token: data.session.refresh_token,
                            id: data.user.id
                        });
                    } else if (data.access_token) {
                        await this.completeAuth({
                            name: name || this.buildDisplayName(email),
                            email: email,
                            access_token: data.access_token,
                            refresh_token: data.refresh_token,
                            id: data.user?.id
                        });
                    } else {
                        window.alert('Реєстрація успішна! Якщо потрібно, перевірте пошту для підтвердження.');
                        await this.openPanel('login');
                    }
                } catch (e) {
                    window.alert('Помилка з\'єднання з сервером реєстрації.');
                }
                return;
            }

            try {
                const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    window.alert('Помилка входу: ' + (data.error_description || data.msg || 'Невірні дані'));
                    return;
                }

                await this.completeAuth({
                    name: data.user.user_metadata?.name || this.buildDisplayName(email),
                    email: email,
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    id: data.user.id
                });
            } catch (e) {
                window.alert('Помилка з\'єднання з сервером авторизації.');
            }
        });
    }

    escapeHtml(str) {
        if (!str) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(str).replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    buildDisplayName(email) {
        const localPart = this.normalizeEmail(email).split('@')[0] || 'cook';
        return localPart
            .split(/[._-]+/)
            .filter(Boolean)
            .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join(' ') || 'Cook';
    }
}
