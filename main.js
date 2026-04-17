/**
 * EatPan Frontend v2 — Entry Point
 *
 * Цей файл — ТІЛЬКИ точка входу.
 * Вся логіка живе в компонентах (src/components/).
 *
 * Структура компонентів:
 *   AppShell → SectorCarousel + MenuOverlay
 *                ↳ Clock / Profile / Auth wedges
 */

import AppShell from './src/components/app_shell/AppShell.js';

// ============================================================
// INIT
// ============================================================
const app = new AppShell();
app.init();
