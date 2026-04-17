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

  // Якщо URL не має нашого проблемного хоста Cloud Supabase, залишаємо як є
  if (!rawUrl.includes(CLOUD_STORAGE_HOST)) return rawUrl;

  // Шукаємо місце, де починається шлях до фото (після імені старого бакету)
  const marker = `/public/${CLOUD_BUCKET}/`;
  const idx = rawUrl.indexOf(marker);
  if (idx === -1) return rawUrl;

  const pathAfterBucket = rawUrl.substring(idx + marker.length);

  // СМАРТ-РЕСОЛВЕР:
  // Якщо ми примусово включили офлайн-режим, беремо фотки з локального порту, 
  // інакше - йдемо через тунель, щоб все було синхронізовано для всієї команди
  const activeBase = FORCE_OFFLINE_MODE ? LOCAL_STORAGE_BASE : TUNNEL_STORAGE_BASE;

  return `${activeBase}/storage/v1/object/public/${TARGET_BUCKET}/${pathAfterBucket}`;
}
