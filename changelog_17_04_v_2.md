# Changelog — 17.04.2026 (v2)

> Сессия разработки: 17.04.2026, ветка `MediaLocalData-for-Recipes-Picture`  
> Продолжение сессии v1. Исправление архитектуры загрузки медиафайлов.

---

## 🎯 Цель

Перенаправить загрузку фотографий рецептов с **Cloud Supabase Storage** (дорого, неправильно) на **Local Supabase Storage** (Docker контейнер `supabase-storage`, порт 6500) через Django API Backend.

---

## 📊 Аудит существующих данных

Перед исправлением проведен аудит всех медиа-ссылок в базе:

| Тип хранения | Кол-во | Источник |
|---|---|---|
| UUID (локально) | 275 фото | `import_example_media` → Local Supabase (`localhost:6500`) ✅ |
| Cloud URL | 12 фото | Прямая загрузка из фронтенда → Cloud Supabase (`pkdnyonrejptotlpzclq...`) ❌ |
| Без медиа | 12 рецептов | — |

**Вывод:** 275 из 287 фото уже хранятся правильно (локально). Только 12 фото (рецепты #238, #213, #186, #133, #47) попали в облако — это те, что были загружены через фронтенд до фикса.

---

## 🔧 Что было (проблема)

### Фронтенд: прямая загрузка в облако

```javascript
// RecipeCreateForm._uploadPhotosAndGetUUIDs() — БЫЛО:
const { data, error } = await supabase.storage
    .from('id_eatpan_media')
    .upload(path, file);           // → CLOUD Supabase (pkdnyonrejptotlpzclq...)

const { data: publicData } = supabase.storage
    .from('id_eatpan_media')
    .getPublicUrl(path);
uuids.push(publicData.publicUrl);  // Сохранялся ПОЛНЫЙ URL, а не UUID!
```

**Почему неправильно:**
1. Файлы летели в Cloud Supabase Storage (дорого для тяжелых файлов)
2. В `data.media.images[]` сохранялся полный URL вместо UUID
3. `mediaResolver.js` не мог перехватить эти URL (другой бакет)
4. Django Backend вообще не участвовал в процессе

---

## ✅ Что стало (исправления)

### 1. Backend: Новый endpoint `POST /api/v1/media/upload/`

**Файл:** `EatPan_Back/recipes/views.py` — новый класс `MediaUploadView`

Поток:
```
Фронтенд → POST FormData(file) → Django API (localhost:6600)
                                       ↓
                            Django читает файл, генерирует UUID
                                       ↓
                            PUT → kong:8000/storage/v1/object/id_eatpan_media/study/recipes/{uuid}/{name}
                                       ↓
                            Local Supabase Storage (контейнер supabase-storage)
                                       ↓
                            MediaAsset.create(uuid, url, kind='image', scope='local_only')
                                       ↓
                            Response: { uuid: "abc-123", url: "http://localhost:6500/..." }
```

**Детали реализации:**
- Использует `MultiPartParser` для приема файлов
- Перенаправляет через REST API (`urllib.request.Request`) в локальный Storage
- Создает запись `MediaAsset` в PostgreSQL
- Возвращает UUID (не URL!) фронтенду
- Поддерживает опциональный `recipe_id` для привязки к рецепту

### 2. Backend: Auto-link MediaAssets при создании рецепта

**Файл:** `EatPan_Back/recipes/views.py` — `RecipeViewSet.perform_create`

При создании рецепта Django автоматически:
1. Читает `data.media.images[]` из JSON
2. Фильтрует только UUID (не URL)
3. Находит "orphan" MediaAssets без привязки к рецепту
4. Привязывает их к новому рецепту

```python
media_uuids = (obj.data or {}).get('media', {}).get('images', [])
valid_uuids = [u for u in media_uuids if not str(u).startswith('http')]
MediaAsset.objects.filter(uuid__in=valid_uuids, recipe__isnull=True).update(recipe=obj)
```

### 3. Backend: Новый URL-маршрут

**Файл:** `EatPan_Back/recipes/urls.py`

```python
path('media/upload/', MediaUploadView.as_view(), name='media-upload'),
```

### 4. Frontend: Upload через Django API

**Файл:** `EatPan_Fr/src/components/recipe_book/RecipeCreateForm.js`

```javascript
// _uploadPhotosAndGetUUIDs() — СТАЛО:
const { apiFetch } = await import('../../core/ApiClient.js');

const formData = new FormData();
formData.append('file', file);

const resp = await apiFetch('/media/upload/', {
    method: 'POST',
    body: formData,
    rawResponse: true,
});

const result = await resp.json();
uuids.push(result.uuid);  // UUID, НЕ URL!
```

### 5. Frontend: FormData поддержка в ApiClient

**Файл:** `EatPan_Fr/src/core/ApiClient.js`

- Добавлена проверка `options.body instanceof FormData`
- Если FormData → НЕ ставить `Content-Type` (браузер сам добавит `multipart/form-data` с boundary)
- Новая опция `rawResponse: true` → возвращает сырой `Response` объект
- `apiFetch` добавлен в export: `export { API_BASE, apiFetch }`

---

## 📁 Измененные файлы

| Файл | Репозиторий | Тип изменения |
|---|---|---|
| `recipes/views.py` | EatPan_Back | NEW: MediaUploadView, MODIFY: perform_create |
| `recipes/urls.py` | EatPan_Back | ADD: /media/upload/ маршрут |
| `src/core/ApiClient.js` | EatPan_Fr | MODIFY: FormData support, rawResponse, export |
| `src/components/recipe_book/RecipeCreateForm.js` | EatPan_Fr | MODIFY: upload через Django API |

---

## 🏗 Архитектура (итоговая)

```
┌──────────────┐     ┌────────────────┐     ┌─────────────────────┐
│  EatPan_Fr   │────►│  EatPan_Back   │────►│  EatPan_Supabase    │
│  Frontend    │     │  Django API    │     │  Docker Storage     │
│  :6800       │     │  :6600 (Docker)│     │  :6500 (kong)       │
│  github.io   │     │  Render (cloud)│     │  supabase-storage   │
└──────────────┘     └────────────────┘     └─────────────────────┘
                                              ├── PostgreSQL (JSON)
                                              └── Storage (медиа ✅)
```

**Правило:** Django — менеджер. Он получает файл от фронтенда и перенаправляет в Local Supabase Storage. Тяжелые файлы НИКОГДА не идут в Cloud Supabase (кроме аватаров).

---

## ⚠️ Известные TODO

1. **12 фото в облаке** (рецепты #238, #213, #186, #133, #47): нужно скачать из Cloud и перезалить в Local Storage, обновить ссылки на UUID
2. **Render (cloud Django):** должен тоже через Cloudflare tunnel отправлять файлы на локальную машину
3. **Попередження "медіа офлайн":** показать баннер когда Local Storage недоступен
4. **Привязка автора:** рецепты привязаны к `request.user`, но для анонимных пользователей на localhost автор = null
