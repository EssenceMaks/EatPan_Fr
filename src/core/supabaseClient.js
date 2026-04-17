/**
 * Supabase Web API Client
 * Using global `window.supabase` exposed via JS CDN in index.html
 */

import { APP_CONFIG } from './config.js';

export const supabase = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
