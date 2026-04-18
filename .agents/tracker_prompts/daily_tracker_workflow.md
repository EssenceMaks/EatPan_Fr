# Step-by-Step Workflow: Daily Tracker

To guarantee a stable and bug-free implementation, the RPG Daily Tracker MUST be built exactly in this sequence. Do not attempt to style complex interactions until the core data model and generic DOM are functioning.

## Phase 1: Foundational DOM & Base Styles
1. **Initialize the Document Structure**:
   - Create root CSS variables for colors, borders, and margins per the `Rules` document.
   - Build a static header row containing:
     - "Расписание на день" text.
     - A 🎨 button for randomizing task colors.
2. **Setup the Grid Generator**:
   - Write a loop `for (let i = 0; i <= 23; i++)` to construct the 24 hour rows (`time_list_current_line`).
   - Append a `tasks-area` wrapper container inside each hour row.

## Phase 2: Primitive Task Generation Layer
1. **Create the Input Wrapper**:
   - Inside each empty `tasksArea`, instantiate a `.task-input-wrapper` DOM node containing exactly 6 `.time_cells_cube` nodes and a text input.
2. **Build the `createTaskItem` Builder**:
   - Implement logic to spin up a fully-fledged `.task-item` complete with a title label, duration label, settings icons (gear/trash/archive), and 6 cubes for the time track. 
   - Tie color-picking via the `getRandomColor()` to assign a valid preset color from the RPG Hex palette.
3. **Data Model Synchronization**:
   - Bind creation to `tasksData[taskId] = { ... }` object state.
   - Force all updates through a centralized `renderCells()` function. (NEVER manually poke background colors randomly outside this loop).

## Phase 3: The Interaction Engine (The Global Mixer)
1. **Implement `renderCells`**:
   - Execute the 144 index calculations to create a globally mapped 2D array of assignments (`globalAssignments`).
   - Iterate through DOM rows.
   - Distribute the array properties to DOM `data-tasks` strings.
2. **Implement `applyColorsToCube`**:
   - Pull in the `hexToRGBA` converter.
   - Render multi-stack `linear-gradient` strings correctly (ensure empty cubes reset `.style.background = ''`).

## Phase 4: Event Delegation & Span Dragging
1. **Span Drag Mechanic**:
   - Add `.hover-select` CSS.
   - Add `isDragging` flags to tracking state.
   - Intercept single clicks on empty cubes to begin drag, listen to `pointermove` to drag over adjacent cubes, and handle the release click.
2. **Populate Conflict Arrays**:
   - In the click event handler, parse `e.target.dataset.tasks`.
   - If array length > 1, switch rendering to `openPopoverConflict` instead of the standard `openPopover`.

## Phase 5: The Floating Absolute Sidebar
1. **Positioning Engine**:
   - Trigger the `#task-popover` DOM configuration.
   - Inject DOM coordinates: `rect.top + window.scrollY - 10`.
2. **Conflict Resolution Sidebar**:
   - Add CSS Grid split (`140px 260px`).
   - Populate the sidebar column dynamically based on intersecting tasks.
3. **Verify and Clean Up**:
   - Add a global `document.addEventListener('click')` that dismisses the popover if the click falls entirely outside `.time_cells_cube`, `.task-item`, or `#task-popover` bounds.
