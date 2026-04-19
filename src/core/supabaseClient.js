/**
 * Supabase Web API Client
 * Using global `window.supabase` exposed via JS CDN in index.html
 * 
 * Note: Session is cached in ApiClient.js (3s TTL) to reduce 
 * concurrent getSession() calls and prevent "orphaned lock" spam.
 */

import { APP_CONFIG } from './config.js';

export const supabase = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL, 
  APP_CONFIG.SUPABASE_ANON_KEY, 
  {
    auth: {
      storageKey: 'sb-pkdnyonrejtotlpzclq-auth-token',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  }
);
