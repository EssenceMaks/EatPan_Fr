# Core Skills & Algorithms: Daily Tracker

To cleanly execute the RPG Daily Tracker, you must perfectly implement the following logical abstractions and technical paradigms.

## 1. Absolute Grid Mapping (Index Mathematics)
The tracker is conceptually a 1-dimensional array of 144 items (24 hours * 6 units).
You must transition from UI logic to Business Logic dynamically:
```javascript
function getCubeIndex(cube) {
    const line = cube.closest('.time_list_current_line');
    const h = parseInt(line.dataset.hour);
    const c = Array.from(cube.parentElement.children).indexOf(cube);
    return h * 6 + c; // Maps 0-143 absolute grid index
}
```

## 2. Span Interpretation (Time Allocation)
When converting a user drag (e.g., indices 30 to 45) into standard time:
```javascript
let hour = Math.floor(startI / 6);
let startM = (startI % 6) * 10;
let totalMins = (endI - startI + 1) * 10;
let durH = Math.floor(totalMins / 60);
let durM = totalMins % 60;
```

## 3. Global Assignment Array & `isMuted` Blending
Because multiple tasks can intersect at any 10-minute slot, you must abstract the overlap logic.
Calculate overlapping task arrays:
1. Re-initialize a blank 144-cube array: `Array.from({ length: 144 }, () => [])`.
2. Iterate through all tasks. Compute `count = Math.max(1, Math.ceil((task.durH * 60 + task.durM) / 10))`.
3. If `absoluteIndex / 6 > task.hour`, flag the task iteration as `isMuted: true` (it has passed its native start hour).
4. `hexToRGBA` Conversion:
```javascript
function hexToRGBA(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
```
5. Apply arrays to UI. Construct overlapping gradients:
```javascript
let parsedColors = layers.map(l => l.isMuted ? hexToRGBA(l.hex, 0.85) : l.hex);
let step = 100 / parsedColors.length;
// Combine into `linear-gradient(to bottom, ...)` string using hard-stop syntax.
```

## 4. Multi-Layer DOM Serialisation
Because standard DOM nodes can't track multi-arrays natively without complex objects, serialize task intersection IDs onto the dataset for easy click delegation.
```javascript
cell.dataset.tasks = JSON.stringify(layers.map(l => l.taskId));
```
When clicked, parse `JSON.parse(tasksStr)` and trigger conflict popovers if `length > 1`.
