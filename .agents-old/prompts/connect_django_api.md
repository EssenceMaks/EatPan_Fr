# Prompt: Connect Django REST API

Use when ready to connect real Django backend instead of mock data.

---

## Prompt Template

```
Подключи реальный Django REST API к EatPan SPA.

Бэкенд: Django REST Framework
Base URL: [YOUR_DJANGO_URL]/api/v1

Что нужно сделать:
1. Обновить константу API_BASE в src/api/RecipeService.js
2. Раскомментировать fetch() запросы (убрать mock-данные)
3. Добавить обработку ошибок и loading-состояний в BookModule.js
4. Добавить CORS-заголовки если нужно

Текущий mock в RecipeService.js:
- fetchAll() → возвращает [{id:1, title:'Steak'}, {id:2, title:'Salad'}]
- fetchDetail(id) → возвращает {id, title, content}

Реальные эндпоинты Django:
- GET [API_BASE]/recipes/       → список рецептов
- GET [API_BASE]/recipes/{id}/  → детали рецепта
- POST [API_BASE]/recipes/      → создать рецепт (auth required)
```

---

## Notes
- CORS: добавь `django-cors-headers` в Django settings
- Auth: JWT токены через `djangorestframework-simplejwt`
