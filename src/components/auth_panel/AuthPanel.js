import Component from '../../core/Component.js';
import { APP_CONFIG } from '../../core/config.js';
import { supabase } from '../../core/supabaseClient.js';
import SparkRibbon from '../ui_kit/spark_ribbon/SparkRibbon.js';
export default class AuthPanel extends Component {
  constructor(props) {
    super(props);
    this.view = 'login'; // login, register, forgot
    this.onAuthSuccess = props.onAuthSuccess || (() => { });
  }

  get overlayRef() {
    let el = document.getElementById('auth-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'auth-overlay';
      el.className = 'auth-overlay';
      const main = document.getElementById('main-content') || document.body;
      main.appendChild(el);
    }
    return el;
  }

  async template() {
    const title = this.view === 'login' ? 'Вхід' : (this.view === 'register' ? 'Реєстрація' : 'Відновлення');
    let content = '';

    if (this.view === 'login') {
      content = `
        <div class="auth-field">
          <label>Email</label>
          <input type="email" id="auth-email" name="email" placeholder="galahad@camelot.com" />
        </div>
        <div class="auth-field">
          <label>Пароль</label>
          <input type="password" id="auth-password" name="password" placeholder="••••••••" />
        </div>
        <div class="auth-toggle" style="text-align: right; margin-top: -8px; font-size: 0.75rem;">
          <a class="js-switch-view" data-view="forgot">Забули пароль?</a>
        </div>
        
        <button class="arc-glyph arc-glyph--concave" id="auth-btn-login" style="margin-top: 12px; width: 100%;">Увійти</button>
        
        <div class="auth-divider-text">— або —</div>
        
        <button class="arc-glyph arc-glyph--pill" id="auth-btn-google" style="margin-top: 8px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 600; font-family: var(--font-title);">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chrome"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>
          Google Auth
        </button>

        <div class="auth-toggle">
          Не маєте акаунту? <a class="js-switch-view" data-view="register">Створити</a>
        </div>
      `;
    } else if (this.view === 'register') {
      content = `
        <div class="auth-field">
          <label>Псевдонім</label>
          <input type="text" id="reg-name" name="name" placeholder="Sir Galahad" />
        </div>
        <div class="auth-field">
          <label>Email</label>
          <input type="email" id="reg-email" name="email" placeholder="galahad@camelot.com" />
        </div>
        <div class="auth-field">
          <label>Пароль</label>
          <input type="password" id="reg-password" name="password" placeholder="••••••••" />
        </div>
        <button class="arc-glyph arc-glyph--concave" id="auth-btn-register" style="margin-top: 12px; width: 100%;">Почати пригоду</button>
        <div class="auth-toggle">
          Вже є акаунт? <a class="js-switch-view" data-view="login">Увійти</a>
        </div>
      `;
    } else {
      content = `
        <div class="auth-field">
          <label>Введіть ваш Email</label>
          <input type="email" name="email" placeholder="galahad@camelot.com" />
        </div>
        <button class="arc-glyph arc-glyph--concave" style="margin-top: 12px; width: 100%;">Надіслати сову</button>
        <div class="auth-toggle">
          Згадали код доступу? <a class="js-switch-view" data-view="login">Увійти</a>
        </div>
      `;
    }

    return `
      <div class="auth-panel" onclick="event.stopPropagation()">
        <!-- Decorative Corners -->
        <div class="auth-panel__corner-tr"></div>
        <div class="auth-panel__corner-br"></div>
        
        <!-- Header: Flags and Close -->
        <div class="auth-panel__header" style="justify-content: flex-end;">
          <div class="auth-panel__close" id="auth-btn-close">
            <i data-lucide="x"></i>
          </div>
        </div>

        <!-- Scrollable Content View -->
        <div class="auth-panel__content">
          <div class="auth-panel__flags" style="display: flex; justify-content: center; gap: 15px; margin-bottom: 20px;">
            <span class="auth-panel__flag active" title="Українська" style="font-size: 1.5rem; cursor: pointer;">🇺🇦</span>
            <span class="auth-panel__flag" title="English" style="font-size: 1.5rem; cursor: pointer;">🇺🇸</span>
            <span class="auth-panel__flag" title="Español" style="font-size: 1.5rem; cursor: pointer;">🇪🇸</span>
          </div>
          <h2 class="auth-form-title">${title}</h2>
          <div class="auth-form" style="position: relative;">
            <div id="google-one-tap-container" style="position: absolute; top: -20px; right: calc(10% + 20px); z-index: 10000; min-width: 350px;"></div>
            ${content}
          </div>
        </div>
      </div>
    `;
  }

  async showError(msg) {
    let container = document.getElementById('spark-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'spark-toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.left = '20px';
      container.style.zIndex = '99999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      container.style.pointerEvents = 'none'; // let clicks pass through
      document.body.appendChild(container);
    }

    const wrapper = document.createElement('div');
    wrapper.style.transform = 'translateX(-120%)';
    wrapper.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    container.appendChild(wrapper);

    const isError = msg.includes('Помилка') || msg.includes('Invalid');

    const alert = new SparkRibbon({
      title: isError ? 'Помилка' : 'Увага!',
      desc: msg,
      type: isError ? 'error' : 'warning',
      clip: 'inward',
      iconStyle: 'square-seal',
      icon: isError ? 'x' : 'alert-triangle'
    });

    await alert.render(wrapper, 'innerHTML');

    // Animate in
    requestAnimationFrame(() => {
      wrapper.style.transform = 'translateX(0)';
    });

    // Remove after 4s
    setTimeout(() => {
      wrapper.style.transform = 'translateX(-120%)';
      setTimeout(() => wrapper.remove(), 400);
    }, 4000);
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });

    // Ensure persistent nonce across reloads and tabs for cached Google tokens
    let rawNonce = localStorage.getItem('eatpan_google_nonce');
    if (!rawNonce) {
      rawNonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      localStorage.setItem('eatpan_google_nonce', rawNonce);
    }

    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(rawNonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    this.currentNonce = rawNonce;

    // Strict check for pure Google Chrome (excludes Opera, Edge, Brave)
    this.isStrictChrome = /Chrome/.test(navigator.userAgent) && 
                          /Google Inc/.test(navigator.vendor) && 
                          !/OPR|Opera|Edg/.test(navigator.userAgent);

    // Initialize Google One Tap ONLY if library is loaded AND browser is strictly Chrome
    // This prevents Opera/Firefox/Safari from triggering background block errors
    if (window.google && this.isStrictChrome) {
      google.accounts.id.initialize({
        client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        prompt_parent_id: 'google-one-tap-container',
        callback: async (response) => {
          // Parse Google JWT to check if it actually contains a nonce
          const payloadBase64Url = response.credential.split('.')[1];
          const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jwtPayload = JSON.parse(decodeURIComponent(atob(payloadBase64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join('')));

          const authParams = {
            provider: 'google',
            token: response.credential
          };

          // ONLY send nonce to Supabase if Google actually encoded it into the token
          // This entirely prevents the "400 Bad Request: both exist or be empty" network error!
          if (jwtPayload.nonce) {
            authParams.nonce = this.currentNonce;
          }

          const { data, error } = await supabase.auth.signInWithIdToken(authParams);

          if (error) {
            this.showError('Помилка Google: ' + error.message);
          } else if (data.session) {
            this.close();
            this.onAuthSuccess(data.session);
          }
        }
      });
    }

    const closeBtn = this.element.querySelector('#auth-btn-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const flags = this.element.querySelectorAll('.auth-panel__flag');
    flags.forEach(flag => {
      flag.addEventListener('click', () => {
        flags.forEach(f => f.classList.remove('active'));
        flag.classList.add('active');
        // Future: change language
      });
    });

    const switchers = this.element.querySelectorAll('.js-switch-view');
    switchers.forEach(el => {
      el.addEventListener('click', async (e) => {
        this.view = e.target.dataset.view;
        await this.softReRender();
      });
    });

    const btnLogin = this.element.querySelector('#auth-btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', async () => {
        // Clear previous errors
        // Error cleared by timeout on SparkRibbon

        const email = this.element.querySelector('#auth-email').value?.trim();
        const password = this.element.querySelector('#auth-password').value;
        if (!email || !password) return this.showError('Заповніть усі поля!');

        btnLogin.textContent = 'Завантаження...';
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          this.showError('Помилка: ' + error.message);
          btnLogin.textContent = 'Увійти';
        } else {
          this.close();
          this.onAuthSuccess(data.session);
        }
      });
    }

    const btnReg = this.element.querySelector('#auth-btn-register');
    if (btnReg) {
      btnReg.addEventListener('click', async () => {
        // Error cleared by timeout on SparkRibbon

        const name = this.element.querySelector('#reg-name').value?.trim();
        const email = this.element.querySelector('#reg-email').value?.trim();
        const password = this.element.querySelector('#reg-password').value;
        if (!email || !password || !name) return this.showError('Заповніть усі поля!');

        btnReg.textContent = 'Створення...';
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { name } }
        });
        if (error) {
          this.showError('Помилка: ' + error.message);
          btnReg.textContent = 'Почати пригоду';
        } else {
          // You could also convert this alert to a success slip if desired
          alert('Реєстрація успішна! ' + (data.session ? '' : 'Необхідно підтвердити Email.'));
          if (data.session) {
            this.close();
            this.onAuthSuccess(data.session);
          }
        }
      });
    }

    const btnGoogle = this.element.querySelector('#auth-btn-google');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async () => {
        const fallbackToOAuth = async () => {
          btnGoogle.innerHTML = 'Завантаження...';
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
              queryParams: { access_type: 'offline', prompt: 'consent' }
            }
          });
          if (error) {
            this.showError('Помилка Google: ' + error.message);
            btnGoogle.innerHTML = 'Google Auth';
          }
        };

        if (window.google && this.isStrictChrome) {
          google.accounts.id.prompt((notification) => {
            // If the One Tap modal fails to display in Chrome (e.g., extensions, FedCM skipped)
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
               console.warn('[EatPan Auth] One Tap failed to display. Reason:', notification.getNotDisplayedReason());
               fallbackToOAuth(); // Auto-fallback to Classic OAuth
            }
          });
        } else {
          // Instantly fallback to Classic OAuth for Opera, Safari, Firefox, Edge, or if SDK is blocked
          console.warn('[EatPan Auth] Non-Chrome or SDK blocked. Using Classic OAuth.');
          fallbackToOAuth();
        }
      });
    }
  }



  async softReRender() {
    if (this.overlayRef) {
      await this.render(this.overlayRef, 'innerHTML');
    }
  }

  async open() {
    this.view = 'login';
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
