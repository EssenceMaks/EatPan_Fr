# Strict Rules & Design Tokens: Daily Tracker

## 1. Global Visual and Dimension Constraints
- **Dark Theme Backgrounds**: Main body `#08141b`. Tracker background `#0b1a22`. Popover `#08141b`.
- **Accents**: Gold (`#c69b50`), Borders (`var(--square-border) = rgba(255, 255, 255, 0.15)`).
- **Time Line Rendering**:
  - 24 exact rows representing hours (0 to 23).
  - Use `display: grid`, specifically `grid-template-columns: 45px 1fr`.
- **Task Rows & Cubes**:
  - `grid-template-columns: 45px 95px 25px 1fr;`
  - Exactly **6 cubes per row**, representing 10-minute intervals.
  - Cube Dimensions: 15px by 15px. Border radius: 2px.

## 2. Palette Constraints
Do not use random RGB strings. Colors must exclusively come from these categories:
- **FOCUS**: `#5B84B1`, `#6F9BC4`, `#8DB6D9`, `#A9CCEA`
- **HEALTH**: `#558B7E`, `#6DA396`, `#86BBAF`, `#A5D4C9`
- **ACTION**: `#c69b50`, `#CD6155`, `#E59866`, `#F0B27A`
- **REST**: `#9B59B6`, `#AF7AC5`, `#C39BD3`, `#D7BDE2`

## 3. DOM & Interaction Rules
1. **Never mutate a cube array dynamically via appendChild if the 144 strict spots exist**. The tracking canvas exists globally as abstract arrays; DOM updates just mirror the state.
2. **Event Listeners**: Add ONE global pointer/click event listener on the `trackerWrapper`. Delegate target checking using `e.target.classList.contains('time_cells_cube')`. Do not bind individual event listeners to every single cube to prevent memory leaks and state desynchronization.
3. **Empty Cell Protection**: If an hour block does not have any visible `.task-item`, ensure the `.task-input-wrapper` is present to allow timeline interaction. Hidden tasks (archived/display: none) MUST NOT prevent the `.task-input-wrapper` rendering.
4. **No Native Drag/Drop required for Span Creation**: Span creation relies on a 2-click process (Click 1 starts `isDragging`, Click 2 finalizes `dragState.endIndex`), intercepting pointer movement with `.hover-select` CSS classes in between.

## 4. Popover Rendering Requirements
- Must use `position: absolute` (NEVER `fixed`).
- X/Y positioning must use `getBoundingClientRect()` from the clicked `time_cells_cube`.
- Top calculation MUST factor in scroll: `rect.top + window.scrollY - 10`.
- Z-index must be at least 1000.
- If a click hits a multi-task intersection, inject CSS Grid layout into the popover: `grid-template-columns: 140px 260px;` and append the `<div class="popover-sidebar">`.
