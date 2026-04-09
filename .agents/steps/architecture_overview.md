# EatPan — Architecture Overview

## Module Graph

```
index.html
    └── main.js  (type="module")
            ├── import BookModule  ─────────────────────────┐
            └── DOMContentLoaded()                           │
                    ├── initInfiniteScroll()                 │
                    ├── createClockFace()                    │
                    ├── setInterval(updateSmallClock)        │
                    ├── cookbookArea.appendChild(            │
                    │       await bookModule.render() ◄──────┘
                    │   )
                    └── lucide.createIcons()

BookModule.js
    ├── extends Component
    ├── onMount() → RecipeService.fetchAll()
    └── appends Book → cover ──► PageLeft + PageRight
```

## Data Flow

```
User Action (onClick tab/category)
    │
    ▼
window.setChapter / window.openCategory  (main.js)
    │
    ▼
DOM classList manipulation (активирует/деактивирует вкладки)
    │
    ▼
[Future] EventBus.emit() → компонент слушает и перерисовывает
```

## CSS Cascade Order

```
1. google fonts (external)
2. src/styles/global.css         ← base reset + SPA layout + design tokens
3. src/modules/recipe-book/styles/book.css     ← book layout
4. src/modules/recipe-book/styles/ribbons.css  ← tabs & ribbons
5. src/modules/recipe-book/styles/media.css    ← responsive overrides
```

## SPA State Machine

```
[IDLE]  ─── click block ──► [ACTIVE BLOCK]  ─── goBack() ──► [IDLE]
  │                               │
  └── click clock ─► [CLOCK MODE] ┘ (goBack returns to block or idle)
```

## Section Blocks (index.html)

| data-index | Name | Content |
|-----------|------|---------|
| 0 | Section Hero | Placeholder |
| 1 | Section My Kitchen | Placeholder |
| 2 | **Section My Cookbook** | **BookModule (recipe-book)** |
| 3 | Supplies & Provisions | Placeholder |
| 4 | Timetable & Calendar | Placeholder |

## Future: Django API Integration

```
RecipeService.js (src/api/)
    ├── fetchAll()    → GET /api/v1/recipes/
    ├── fetchDetail() → GET /api/v1/recipes/{id}/
    └── create()      → POST /api/v1/recipes/  (TODO)

Currently: mock data with 500ms delay simulation
```
