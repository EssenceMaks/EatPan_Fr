# Базовые навыки и алгоритмы: Daily Tracker

Для чистого и безошибочного создания RPG Daily Tracker вам необходимо безупречно реализовать следующие логические абстракции и технические парадигмы.

## 1. Абсолютное картографирование Сетки (Индексная математика)
Трекер концептуально является одномерным массивом из 144 элементов (24 часа * 6 единиц-интервалов).
Вы должны осуществлять динамический переход от UI к бизнес-логике:
```javascript
function getCubeIndex(cube) {
    const line = cube.closest('.time_list_current_line');
    const h = parseInt(line.dataset.hour);
    const c = Array.from(cube.parentElement.children).indexOf(cube);
    return h * 6 + c; // Преобразует позицию в абсолютный индекс 0-143
}
```

## 2. Интерпретация промежутков (Распределение Времени)
При конвертации пользовательского перетаскивания мыши (например, от индекса 30 до 45) в стандартизированное время задачи:
```javascript
let hour = Math.floor(startI / 6);
let startM = (startI % 6) * 10;
let totalMins = (endI - startI + 1) * 10;
let durH = Math.floor(totalMins / 60);
let durM = totalMins % 60;
```

## 3. Массив глобального микшера и наслаивание (`isMuted`)
Поскольку сразу несколько задач могут пересекаться в одном любом 10-минутном слоте, вы должны абстрагировать логику пересечений.
Вычисление пересекающихся массивов задач:
1. Реинициализировать пустой массив на 144 слота-кубика: `Array.from({ length: 144 }, () => [])`.
2. Пройти циклом по всем задачам. Вычислить длину в кубиках: `count = Math.max(1, Math.ceil((task.durH * 60 + task.durM) / 10))`.
3. Если текущий час рендера не равен стартовому (`absoluteIndex / 6 > task.hour`), пометить эту итерацию задачи как `isMuted: true` (она является "проходящей" вне своего титульного часа).
4. Конвертация `hexToRGBA`:
```javascript
function hexToRGBA(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
```
5. Применение массивов к UI. Создание градиентов из пересечений:
```javascript
let parsedColors = layers.map(l => l.isMuted ? hexToRGBA(l.hex, 0.85) : l.hex);
let step = 100 / parsedColors.length;
// Скомбинируйте это в строковое значение `linear-gradient(to bottom, ...)` с жесткими стоп-рамками (%) изменения цвета.
```

## 4. Многослойная сериализация DOM-узлов
Поскольку стандартные узлы DOM не могут хранить в себе JS-массивы объектов, необходимо сериализовать ID пересекающихся задач напрямую в атрибут HTML (`dataset`) каждого кубика для делегирования кликов.
```javascript
cell.dataset.tasks = JSON.stringify(layers.map(l => l.taskId));
```
При клике на кубик: распарсировать это значение `JSON.parse(tasksStr)` и триггерить вызов конфликтного поповера, если размер массива `length > 1`.
