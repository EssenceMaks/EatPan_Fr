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

// Цільовий правильний бакет у вашому локальному Docker
const TARGET_BUCKET = 'id_eatpan_media';

// Визначаємо, чи користувач зараз сидить за вашим робочим комп'ютером (де запущений Docker)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Базові адреси
const LOCAL_STORAGE_BASE = 'http://localhost:6500';

// !!! ТУТ МАЄ БУТИ ДОМЕН ВАШОГО СВІЖОГО ХМАРНОГО ТУНЕЛЮ ДЛЯ ПОРТУ 6500 !!!
// Оскільки ви створюєте тунель, замініть це значення на реальний домен,
// який ви прив'язали в Cloudflare до http://localhost:6500 (наприклад: https://media.eatpan.com)
const TUNNEL_STORAGE_BASE = 'https://media.eatpan.com';

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
  // Якщо це ви розробляєте на localhost - запит піде на localhost:6500
  // Якщо це будь-який інший юзер з Github Pages - запит піде через ваш новий Cloudflare тунель
  const activeBase = isLocalhost ? LOCAL_STORAGE_BASE : TUNNEL_STORAGE_BASE;

  return `${activeBase}/storage/v1/object/public/${TARGET_BUCKET}/${pathAfterBucket}`;
}
