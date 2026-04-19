/**
 * mediaResolver.js — Утиліта для резолюції URL медіафайлів
 *
 * Проблема:
 *   URL-и в БД вказують на Cloud Supabase (pkdnyonrejptotlpzclq.supabase.co)
 *   з бакетом 'ideatpanmedia', але зображення фізично лежать лише в
 *   локальному Docker Supabase (localhost:6500) під бакетом 'id_eatpan_media'.
 *
 * Ця утиліта перетворює URL з хмарного формату на правильний маршрут:
 *   - Якщо ви на комп'ютері з Docker (localhost), тягнемо фотографії з http://localhost:6500
 *   - Якщо ви зовнішній юзер (github.io, інший ПК, телефон), тягнемо через ваш новий тунель
 */

// Cloud Supabase host (тут зображень немає)
const CLOUD_STORAGE_HOST = 'pkdnyonrejptotlpzclq.supabase.co';
const CLOUD_BUCKET = 'ideatpanmedia';

// ==========================================
// 🛠️ РЕЖИМ РОЗРОБНИКА / ОФЛАЙН РЕЖИМ 🛠️
// Увімкніть 'true', якщо у вас пропав інтернет 
// і ви хочете працювати ПОВНІСТЮ ОФЛАЙН (через прямий доступ до localhost:6500).
// ВАЖЛИВО: Перед пушем на Github бажано повертати на 'false'!
// ==========================================
const FORCE_OFFLINE_MODE = false;

// Цільовий правильний бакет у вашому локальному Docker
const TARGET_BUCKET = 'id_eatpan_media';

// ЗАВЖДИ використовуємо тунель для всіх:
// - І для вас (Майстра)
// - І для інших розробників, які запускають локально (localhost:6800)
// - І для кінцевих користувачів на Github Pages
const TUNNEL_STORAGE_BASE = 'https://supa_media.eatpan.com';
const LOCAL_STORAGE_BASE = 'http://localhost:6500';

/**
 * Перетворює URL
 */
export function resolveMediaUrl(rawUrl) {
  if (!rawUrl) return null;

  // Case 0: Pure UUID (New standard architecture)
  // Backend MediaResolveView will handle the 302 Redirect to the actual storage path
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUrl);
  if (isUUID) {
     const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
     const apiBase = isLocal ? 'http://localhost:6600/api/v1' : 'https://api.eatpan.com/api/v1';
     return `${apiBase}/media/${rawUrl}/`;
  }

  const activeBase = FORCE_OFFLINE_MODE ? LOCAL_STORAGE_BASE : TUNNEL_STORAGE_BASE;

  // Case 1: Old Cloud Supabase
  if (rawUrl.includes(CLOUD_STORAGE_HOST)) {
    const marker = `/public/${CLOUD_BUCKET}/`;
    const idx = rawUrl.indexOf(marker);
    if (idx !== -1) {
      const pathAfterBucket = rawUrl.substring(idx + marker.length);
      return `${activeBase}/storage/v1/object/public/${TARGET_BUCKET}/${pathAfterBucket}`;
    }
  }

  // Case 2: Local Docker or Tunnel URL (needs rewriting based on active mode)
  if (rawUrl.startsWith(LOCAL_STORAGE_BASE)) {
    return rawUrl.replace(LOCAL_STORAGE_BASE, activeBase);
  }
  if (rawUrl.startsWith(TUNNEL_STORAGE_BASE)) {
    return rawUrl.replace(TUNNEL_STORAGE_BASE, activeBase);
  }

  return rawUrl;
}
