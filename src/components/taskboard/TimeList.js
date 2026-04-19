import Component from '../../core/Component.js';

export default class TimeList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragState: {
        isDragging: false,
        startIndex: null,
        endIndex: null
      }
    };
  }

  async template() {
    return `
      <div class="tb-timeline-col">
          <div class="header-row">
              <div class="col-1"><span class="header-label">ЧАС</span></div>
              <div class="col-2" style="display: flex; align-items: center; justify-content: space-between; padding-right: 5px;">
                  <span class="header-label">СЛОТИ</span>
                  <span id="randomize-colors-btn" title="Випадкові кольори квестів" style="cursor: pointer; font-size: 12px; transition: transform 0.1s;">🎨</span>
              </div>
              <div class="col-3"></div>
              <div class="col-4"><span class="header-label">КВЕСТ</span></div>
          </div>
          <div class="time_list_wrapper" id="time-list-wrapper">
             ${this.generateTimelineGrid()}
          </div>
      </div>
    `;
  }

  generateTimelineGrid() {
    let html = '';
    for (let i = 0; i <= 23; i++) {
        html += `
        <div class="time_list_current_line" data-hour="${i}">
            <div class="tasks-area"></div>
        </div>`;
    }
    return html;
  }

  async onMount() {
    this.setupDOM();
    this.setEvents();
  }

  setupDOM() {
    for (let i = 0; i <= 23; i++) {
        const area = this.element.querySelector(`.time_list_current_line[data-hour="${i}"] .tasks-area`);
        this.createTaskInput(area, i, false);
    }

    for (const [taskId, task] of Object.entries(this.props.questsData)) {
        if (!task.archived) {
           this.createTaskItemDOM(taskId, task);
        }
    }
    
    this.refreshCells();
  }

  setEvents() {
    const wrapper = this.element.querySelector('#time-list-wrapper');
    
    // Кліки та перетягування на таймлайні
    wrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('time_cells_cube')) {
            const index = this.getCubeIndex(e.target);
            if (index === null) return;
            
            let tasksStr = e.target.dataset.tasks;
            let tasksList = tasksStr && tasksStr !== "[]" ? JSON.parse(tasksStr) : [];

            if (!this.state.dragState.isDragging) {
                if (tasksList.length > 0) {
                    if (this.props.onSelect) this.props.onSelect(tasksList[0]);
                } else {
                    this.state.dragState.isDragging = true;
                    this.state.dragState.startIndex = index;
                    this.state.dragState.endIndex = index;
                    this.updateHoverSelection();
                }
            } else {
                this.state.dragState.isDragging = false;
                this.state.dragState.endIndex = index;
                this.element.querySelectorAll('.time_cells_cube').forEach(c => c.classList.remove('hover-select'));

                const startNum = Math.min(this.state.dragState.startIndex, this.state.dragState.endIndex);
                const endNum = Math.max(this.state.dragState.startIndex, this.state.dragState.endIndex);
                
                this.handleCubeDragCreate(startNum, endNum);
                
                this.state.dragState.startIndex = null;
                this.state.dragState.endIndex = null;
            }
        }
    });

    this.element.addEventListener('pointermove', (e) => {
        if (!this.state.dragState.isDragging) return;
        let cube = document.elementFromPoint(e.clientX, e.clientY);
        if (cube && cube.classList.contains('time_cells_cube')) {
            const index = this.getCubeIndex(cube);
            if (index !== null && index !== this.state.dragState.endIndex) {
                this.state.dragState.endIndex = index;
                this.updateHoverSelection();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (this.state.dragState.isDragging && !e.target.closest('.time_list_current_line')) {
            this.state.dragState.isDragging = false;
            this.state.dragState.startIndex = null;
            this.state.dragState.endIndex = null;
            this.element.querySelectorAll('.time_cells_cube').forEach(c => c.classList.remove('hover-select'));
        }
    });

    // Перетягування квестів на години
    wrapper.addEventListener('dragover', (e) => {
      const line = e.target.closest('.time_list_current_line');
      if (line) {
        e.preventDefault();
        line.style.backgroundColor = 'var(--hover-bg)';
      }
    });

    wrapper.addEventListener('dragleave', (e) => {
      const line = e.target.closest('.time_list_current_line');
      if (line) line.style.backgroundColor = '';
    });

    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const line = e.target.closest('.time_list_current_line');
      if (!line) return;
      line.style.backgroundColor = '';
      
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId && this.props.questsData[taskId]) {
          const newHour = parseInt(line.dataset.hour);
          const tasksArea = line.querySelector('.tasks-area');
          tasksArea.querySelectorAll('.task-input-wrapper').forEach(w => w.remove());
          
          const rowEl = document.getElementById(taskId);
          if (rowEl) {
             tasksArea.appendChild(rowEl);
          }
          this.syncFirstChild(tasksArea, newHour);
          
          if (this.props.onUpdateHour) this.props.onUpdateHour(taskId, newHour);
      }
    });

    this.element.addEventListener('click', (e) => {
        if (e.target.closest('#randomize-colors-btn')) {
            if (this.props.onRandomizeColors) this.props.onRandomizeColors();
        }
    });

    this.element.addEventListener('click', (e) => {
       const btn = e.target.closest('.tool-btn');
       if (btn) {
           const action = btn.dataset.action;
           const row = btn.closest('.task-item');
           const taskId = row.id;

           if (action === 'done') {
               if (this.props.onToggleDone) this.props.onToggleDone(taskId);
           } 
           else if (action === 'archive') {
               row.remove();
               this.afterTaskRemoved(row);
               if (this.props.onArchive) this.props.onArchive(taskId);
           }
           else if (action === 'trash') {
               if (confirm('Ви дійсно хочете видалити квест?')) {
                   row.remove();
                   this.afterTaskRemoved(row);
                   if (this.props.onTrash) this.props.onTrash(taskId);
               }
           }
       }
    });

    // Вибір за підписом
    this.element.addEventListener('click', (e) => {
       const group = e.target.closest('.task-title-group');
       if(group) {
           const row = group.closest('.task-item');
           if(row && this.props.onSelect) this.props.onSelect(row.id);
       }
    });
  }

  updateHoverSelection() {
    const startNum = Math.min(this.state.dragState.startIndex, this.state.dragState.endIndex);
    const endNum = Math.max(this.state.dragState.startIndex, this.state.dragState.endIndex);
    this.element.querySelectorAll('.time_cells_cube').forEach((cube) => {
        const idx = this.getCubeIndex(cube);
        if (idx !== null && idx >= startNum && idx <= endNum) {
            cube.classList.add('hover-select');
        } else {
            cube.classList.remove('hover-select');
        }
    });
  }

  handleCubeDragCreate(startI, endI) {
    let hour = Math.floor(startI / 6);
    let startM = (startI % 6) * 10;
    let totalMins = (endI - startI + 1) * 10;
    let durH = Math.floor(totalMins / 60);
    let durM = totalMins % 60;
    
    if (this.props.onCreate) {
        this.props.onCreate(hour, startM, durH, durM);
    }
  }

  getRandomColor() {
      // Цей помічник потрібен, оскільки раніше він був у TaskBoard
      const h = Math.floor(Math.random() * 360);
      return `hsl(${h}, 50%, 60%)`;
  }

  // --- Відкрито для батьківського компонента через this.timeList.refreshCells() ---
  refreshCells() {
    let globalAssignments = Array.from({ length: 144 }, () => []);
    const questsData = this.props.questsData;
    
    // Переконатися, що квести знаходяться у правильному DOM-контейнері під час зміни їхньої години
    for (const key in questsData) {
        const task = questsData[key];
        if (task.archived) continue;
        const row = this.element.querySelector(`[id="${key}"]`);
        if (row) {
            const currentLine = row.closest('.time_list_current_line');
            if (currentLine && parseInt(currentLine.dataset.hour) !== task.hour) {
                const newArea = this.element.querySelector(`.time_list_current_line[data-hour="${task.hour}"] .tasks-area`);
                if (newArea) {
                    const oldArea = currentLine.querySelector('.tasks-area');
                    newArea.querySelectorAll('.task-input-wrapper').forEach(w => w.remove());
                    newArea.appendChild(row);
                    this.syncFirstChild(oldArea, parseInt(currentLine.dataset.hour));
                    this.ensureInputIfEmpty(oldArea, parseInt(currentLine.dataset.hour));
                    this.syncFirstChild(newArea, task.hour);
                }
            }
        }
    }

    for (const key in questsData) {
        const task = questsData[key];
        if (task.archived) continue;

        let startI = task.hour * 6 + Math.floor(task.startM / 10);
        let count = Math.max(1, Math.ceil((task.durH * 60 + task.durM) / 10));
        let colHex = task.completed ? '#3b4d56' : task.color;

        for (let i = 0; i < count; i++) {
            let absoluteIndex = startI + i;
            if (absoluteIndex < 144) {
                let currentH = Math.floor(absoluteIndex / 6);
                let isMuted = currentH > task.hour;
                globalAssignments[absoluteIndex].push({ hex: colHex, isMuted: isMuted, taskId: key });
            }
        }
    }

    for (let h = 0; h < 24; h++) {
        const line = this.element.querySelector(`.time_list_current_line[data-hour="${h}"]`);
        if(!line) continue;
        const tasksArea = line.querySelector(`.tasks-area`);
        if (!tasksArea) continue;

        const children = Array.from(tasksArea.children).filter(c => c.style.display !== 'none');
        children.forEach(row => {
            const cubes = row.querySelectorAll('.time_cells_cube');
            if (row.classList.contains('task-input-wrapper')) {
                const hasTasks = Array.from(tasksArea.children).some(c => c.classList.contains('task-item') && c.style.display !== 'none');
                for (let c = 0; c < 6; c++) {
                    if (!hasTasks) this.applyColorsToCube(cubes[c], globalAssignments[h * 6 + c]);
                    else this.applyColorsToCube(cubes[c], []);
                }
            } else if (row.classList.contains('task-item')) {
                const myTaskId = row.id;
                for (let c = 0; c < 6; c++) {
                    let absoluteIndex = h * 6 + c;
                    let slotTasks = globalAssignments[absoluteIndex];
                    let layers = [];

                    let myTaskInSlot = slotTasks.find(t => t.taskId === myTaskId);
                    if (myTaskInSlot) layers.push({ hex: myTaskInSlot.hex, isMuted: false, taskId: myTaskId });
                    let incomingTasks = slotTasks.filter(t => t.isMuted && t.taskId !== myTaskId);
                    layers.push(...incomingTasks);

                    this.applyColorsToCube(cubes[c], layers);
                }
            }
        });
    }

    this.updateTaskLabels();
    this.updateActiveQuestHighlight();
  }

  updateActiveQuestHighlight() {
     this.element.querySelectorAll('.task-item').forEach(el => el.classList.remove('active-quest'));
     if(this.props.activeQuestId) {
         const row = this.element.querySelector(`[id="${this.props.activeQuestId}"]`);
         if(row) row.classList.add('active-quest');
     }
  }

  // Допоміжні функції, перенесені з TaskBoard
  getCubeIndex(cube) {
    const line = cube.closest('.time_list_current_line');
    if(!line) return null;
    return parseInt(line.dataset.hour) * 6 + Array.from(cube.parentElement.children).indexOf(cube);
  }

  hexToRGBA(hex, alpha) {
    if(!hex || hex.startsWith('hsl') || hex.startsWith('rgb')) return hex;
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex; 
    return `rgba(${r},${g},${b},${alpha})`;
  }

  applyColorsToCube(cell, layers) {
    cell.style.background = ''; cell.style.borderColor = ''; cell.style.boxShadow = '';
    cell.className = 'time_cells_cube';

    if (!cell || layers.length === 0) {
        if(cell) cell.dataset.tasks = '[]';
        return;
    }
    cell.dataset.tasks = JSON.stringify(layers.map(l => l.taskId));
    const parsedColors = layers.map(l => l.isMuted ? this.hexToRGBA(l.hex, 0.85) : l.hex);

    if (parsedColors.length === 1) {
        cell.style.background = parsedColors[0];
        if (layers[0].hex === '#3b4d56') cell.style.borderColor = '#3b4d56';
        else {
            cell.style.borderColor = layers[0].isMuted ? this.hexToRGBA(layers[0].hex, 0.7) : layers[0].hex;
            if (!layers[0].isMuted && layers[0].hex.startsWith('#')) {
                let r = parseInt(layers[0].hex.slice(1, 3), 16), g = parseInt(layers[0].hex.slice(3, 5), 16), b = parseInt(layers[0].hex.slice(5, 7), 16);
                if (!isNaN(r)) cell.style.boxShadow = `0 0 5px rgba(${r},${g},${b},0.6)`;
            }
        }
    } else {
        let gradientStops = [];
        let step = 100 / parsedColors.length;
        for (let i = 0; i < parsedColors.length; i++) {
            gradientStops.push(`${parsedColors[i]} ${i * step}%`);
            gradientStops.push(`${parsedColors[i]} ${(i + 1) * step}%`);
        }
        cell.style.background = `linear-gradient(to bottom, ${gradientStops.join(', ')})`;
        let hasActive = layers.some(l => !l.isMuted);
        cell.style.borderColor = hasActive ? '#c69b50' : '#5c7482';
        if(hasActive) cell.style.boxShadow = '0 0 4px rgba(198, 155, 80, 0.5)';
    }
  }

  updateTaskLabels() {
    for (const key in this.props.questsData) {
        const task = this.props.questsData[key];
        const row = this.element.querySelector(`[id="${key}"]`);
        if (!row) continue;

        let startTotal = task.hour * 60 + task.startM;
        let endTotal = startTotal + (task.durH * 60) + task.durM;
        let hourBoundary = (task.hour + 1) * 60;

        const titleGroup = row.querySelector('.task-title-group');
        if (!titleGroup) continue;

        let endLabel = titleGroup.querySelector('.end-time-label');

        if (endTotal > hourBoundary) {
            let endH = Math.floor(endTotal / 60) % 24;
            let endM = endTotal % 60;
            let timeStr = `(до ${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')})`;
            if (!endLabel) {
                endLabel = document.createElement('span');
                endLabel.className = 'end-time-label';
                titleGroup.appendChild(endLabel);
            }
            endLabel.textContent = timeStr;
        } else if (endLabel) {
            endLabel.remove();
        }
        
        // Оновлення локального текстового відображення
        const titleSpan = titleGroup.querySelector('.task-title-text');
        if(titleSpan) titleSpan.textContent = task.title;
        
        const btnDone = row.querySelector('.tool-btn[data-action="done"]');
        if(btnDone) btnDone.innerHTML = task.completed ? '☑' : '☐';
        
        if (task.completed) row.classList.add('completed');
        else row.classList.remove('completed');
    }
  }

  createRow(type) {
    const row = document.createElement('div');
    row.className = `task-row ${type}`;
    const col1 = document.createElement('div'); col1.className = 'col-1';
    const col2 = document.createElement('div'); col2.className = 'col-2 time_cells_conteiner';
    for (let j = 0; j < 6; j++) {
        const cell = document.createElement('div');
        cell.className = 'time_cells_cube';
        col2.appendChild(cell);
    }
    const col3 = document.createElement('div'); col3.className = 'col-3';
    const col4 = document.createElement('div'); col4.className = 'col-4 task-content-wrapper'; 
    row.append(col1, col2, col3, col4);
    return row;
  }

  createTaskInput(tasksArea, hour, focus = false) {
    const row = this.createRow('task-input-wrapper');
    const input = document.createElement('input');
    input.className = 'task-input';
    input.placeholder = 'Вільний час... (Клік для квесту)';
    row.querySelector('.col-4').appendChild(input);

    tasksArea.appendChild(row);
    this.syncFirstChild(tasksArea, hour);

    let isCreated = false;
    const finalizeCreation = () => {
        if (isCreated) return;
        const text = input.value.trim();
        if (text !== '') {
            isCreated = true;
            row.remove();
            if (this.props.onCreateText) this.props.onCreateText(text, hour);
        }
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finalizeCreation(); });
    input.addEventListener('blur', finalizeCreation);
    if (focus) input.focus();
  }

  createTaskItemDOM(taskId, task) {
    const existing = this.element.querySelector(`[id="${taskId}"]`);
    if (existing) return; // Запобігання дублюванню

    const row = this.createRow('task-item');
    row.id = taskId;
    row.draggable = true;
    if (task.completed) row.classList.add('completed');

    row.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', taskId);
        if(this.props.onSelect) this.props.onSelect(taskId);
    });

    row.addEventListener('dragend', () => {
        this.element.querySelectorAll('.tasks-area').forEach((area) => {
            const h = parseInt(area.closest('.time_list_current_line').dataset.hour);
            this.syncFirstChild(area, h);
            this.ensureInputIfEmpty(area, h);
        });
        this.refreshCells();
    });

    const col4 = row.querySelector('.col-4');
    const titleGroup = document.createElement('div'); titleGroup.className = 'task-title-group';
    const titleSpan = document.createElement('span'); titleSpan.className = 'task-title-text';
    titleGroup.appendChild(titleSpan);

    const toolsDiv = document.createElement('div'); toolsDiv.className = 'task-tools';
    const btnDone = document.createElement('span'); btnDone.className = 'tool-btn'; btnDone.dataset.action = 'done';
    const btnArchive = document.createElement('span'); btnArchive.className = 'tool-btn'; btnArchive.innerHTML = '📥'; btnArchive.dataset.action = 'archive';
    const btnTrash = document.createElement('span'); btnTrash.className = 'tool-btn'; btnTrash.innerHTML = '🗑'; btnTrash.dataset.action = 'trash';
    toolsDiv.append(btnDone, btnArchive, btnTrash);
    
    col4.append(titleGroup, toolsDiv);

    let area = this.element.querySelector(`.time_list_current_line[data-hour="${task.hour}"] .tasks-area`);
    if(area) {
        area.querySelectorAll('.task-input-wrapper').forEach(w => w.remove());
        area.appendChild(row);
        this.syncFirstChild(area, task.hour);
    }
  }
  
  injectTaskItemDOM(taskId, task) {
     this.createTaskItemDOM(taskId, task);
  }

  syncFirstChild(tasksArea, hour) {
    if(!tasksArea) return;
    const children = Array.from(tasksArea.children).filter(c => c.style.display !== 'none');
    children.forEach((child, index) => {
        const col1 = child.querySelector('.col-1'); const col3 = child.querySelector('.col-3');
        if(!col1 || !col3) return;
        col1.innerHTML = ''; col3.innerHTML = '';

        if (index === 0) {
            col1.innerHTML = `<div class="time-label">${hour.toString().padStart(2, '0')}:00</div>`;
            const addBtn = document.createElement('div'); addBtn.className = 'add-btn'; addBtn.textContent = '+';
            addBtn.onclick = () => this.createTaskInput(tasksArea, hour, true);
            col3.appendChild(addBtn);
        } else {
            if (child.classList.contains('task-input-wrapper')) {
                const removeBtn = document.createElement('div'); removeBtn.className = 'remove-btn'; removeBtn.textContent = '–';
                removeBtn.onclick = () => {
                    child.remove();
                    this.syncFirstChild(tasksArea, hour);
                    this.refreshCells();
                    this.ensureInputIfEmpty(tasksArea, hour);
                };
                col3.appendChild(removeBtn);
            } else {
                const dragHandle = document.createElement('div'); dragHandle.className = 'drag-handle'; dragHandle.textContent = '≡';
                col3.appendChild(dragHandle);
            }
        }
    });
  }

  ensureInputIfEmpty(tasksArea, hour) {
    if(!tasksArea) return;
    let visibleCount = Array.from(tasksArea.children).filter(c => c.style.display !== 'none').length;
    if (visibleCount === 0) {
        this.createTaskInput(tasksArea, hour, false);
    }
  }

  afterTaskRemoved(row) {
    const parentArea = row.closest('.tasks-area');
    if (parentArea) {
        const h = parseInt(parentArea.closest('.time_list_current_line').dataset.hour);
        this.syncFirstChild(parentArea, h);
        this.ensureInputIfEmpty(parentArea, h);
    }
  }
}
