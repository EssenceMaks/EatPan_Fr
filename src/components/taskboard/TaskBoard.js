import Component from '../../core/Component.js';
import { supabase } from '../../core/supabaseClient.js';
import { TaskService } from '../../core/ApiClient.js';
import TimeList from './TimeList.js';
import QuestList from './QuestList.js';
import QuestSettings from './QuestSettings.js';

/**
 * TaskBoard (Quest Tracker Orchestrator)
 * 3-Column Grid Layout: Timeline, Quest List, Details
 */
export default class TaskBoard extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      questsData: {},
      activeQuestId: null,
      questCounter: 1,
      userId: null
    };

    // Підкомпоненти
    this.timeList = null;
    this.questList = null;
    this.questSettings = null;
    
    // Таймер для дебаунсу збережень
    this.saveDebounce = null;
  }

  async onMount() {
    // Визначення контексту користувача для сховища (Стадія 1 використовує це як ключ)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      this.state.userId = session.user.id;
    }

    // Завантаження стану
    this.loadState();
    
    // Ініціалізація компонентів
    this.initTimeList();
    this.initQuestList();
    this.initQuestSettings();
  }

  // ============================================
  // ШАБЛОНІЗАЦІЯ
  // ============================================
  async template() {
    return `
      <div class="taskboard-layout">
        <!-- COLUMN 1: TIMELINE -->
        <div id="col-timeline" style="display: contents;"></div>

        <!-- COLUMN 2: QUEST LIST -->
        <div id="col-questlist" style="display: contents;"></div>

        <!-- COLUMN 3: QUEST DETAILS -->
        <div id="col-settings" style="display: contents;"></div>
      </div>
    `;
  }

  // ============================================
  // ІНІЦІАЛІЗАТОРИ
  // ============================================
  async initTimeList() {
      this.timeList = new TimeList({
          questsData: this.state.questsData,
          activeQuestId: this.state.activeQuestId,
          
          onCreate: async (hour, startM, MathDurH, MathDurM) => {
              const tempId = 'quest-' + Date.now() + Math.random().toString(36).substring(2, 5);
              const title = `Квест ${this.state.questCounter}`;
              
              const newTask = {
                  title: title, desc: '', hour: hour, startM: startM, 
                  durH: MathDurH, durM: MathDurM, 
                  color: this.timeList.getRandomColor(), 
                  completed: false, archived: false, media_assets: []
              };
              
              this.state.questsData[tempId] = newTask;
              this.state.questCounter++;
              
              this.timeList.injectTaskItemDOM(tempId, newTask);
              this.setActiveQuest(tempId);
              
              this.timeList.refreshCells();
              this.questList.refreshList();
              
              try {
                  const created = await TaskService.create(newTask);
                  if (created && created.uuid) {
                      delete this.state.questsData[tempId];
                      this.state.questsData[created.uuid] = created;
                      const row = this.element.querySelector(`[id="${tempId}"]`);
                      if (row) row.id = created.uuid;
                      this.timeList.refreshCells();
                      this.questList.refreshList();
                      if (this.state.activeQuestId === tempId) this.setActiveQuest(created.uuid);
                  }
              } catch(e) { console.error("API Create Error", e); }
          },

          onCreateText: async (text, hour) => {
              const tempId = 'quest-' + Date.now();
              const newTask = {
                  title: text, desc: '', hour: hour, startM: 0, 
                  durH: 1, durM: 0, 
                  color: this.timeList.getRandomColor(), 
                  completed: false, archived: false, media_assets: []
              };
              this.state.questsData[tempId] = newTask;
              this.state.questCounter++;
              
              this.timeList.injectTaskItemDOM(tempId, newTask);
              this.timeList.refreshCells();
              this.questList.refreshList();

              try {
                  const created = await TaskService.create(newTask);
                  if (created && created.uuid) {
                      delete this.state.questsData[tempId];
                      this.state.questsData[created.uuid] = created;
                      const row = this.element.querySelector(`[id="${tempId}"]`);
                      if (row) row.id = created.uuid;
                      this.timeList.refreshCells();
                      this.questList.refreshList();
                      if (this.state.activeQuestId === tempId) this.setActiveQuest(created.uuid);
                  }
              } catch(e) { console.error("API Create Error", e); }
          },

          onSelect: (taskId) => {
              this.setActiveQuest(taskId);
          },

          onUpdateHour: (taskId, newHour) => {
              this.state.questsData[taskId].hour = newHour;
              this.timeList.refreshCells();
              if(this.state.activeQuestId === taskId) this.questSettings.renderDetails();
              this.questList.refreshList();
              
              if (!taskId.startsWith('quest-')) {
                  TaskService.update(taskId, { hour: newHour }).catch(e => console.error(e));
              }
          },

          onRandomizeColors: async () => {
              for (let key in this.state.questsData) {
                  this.state.questsData[key].color = this.timeList.getRandomColor();
                  if (!key.startsWith('quest-')) {
                      TaskService.update(key, { color: this.state.questsData[key].color }).catch(e=>e);
                  }
              }
              this.timeList.refreshCells();
              this.questList.refreshList();
              if(this.state.activeQuestId) this.questSettings.renderDetails();
          },

          onToggleDone: (taskId) => {
              this.state.questsData[taskId].completed = !this.state.questsData[taskId].completed;
              this.timeList.refreshCells();
              this.questList.refreshList();
              if (!taskId.startsWith('quest-')) {
                  TaskService.update(taskId, { completed: this.state.questsData[taskId].completed }).catch(e=>e);
              }
          },

          onArchive: (taskId) => {
              this.state.questsData[taskId].archived = true;
              this.timeList.refreshCells();
              this.questList.refreshList();
              if (this.state.activeQuestId === taskId) this.setActiveQuest(null);
              if (!taskId.startsWith('quest-')) {
                  TaskService.update(taskId, { archived: true }).catch(e=>e);
              }
          },

          onTrash: (taskId) => {
              delete this.state.questsData[taskId];
              this.timeList.refreshCells();
              this.questList.refreshList();
              if (this.state.activeQuestId === taskId) this.setActiveQuest(null);
              if (!taskId.startsWith('quest-')) {
                  TaskService.delete(taskId).catch(e=>e);
              }
          }
      });
      await this.timeList.render(this.element.querySelector('#col-timeline'), 'replace');
  }

  async initQuestList() {
      this.questList = new QuestList({
          questsData: this.state.questsData,
          activeQuestId: this.state.activeQuestId,
          onSelect: (taskId) => this.setActiveQuest(taskId)
      });
      await this.questList.render(this.element.querySelector('#col-questlist'), 'replace');
  }

  async initQuestSettings() {
      this.questSettings = new QuestSettings({
          activeQuestId: this.state.activeQuestId,
          getQuestData: (id) => this.state.questsData[id], // Передаємо доступ до отримання живого посилання
          onUpdate: (taskId, updates) => {
              if(!this.state.questsData[taskId]) return;
              Object.assign(this.state.questsData[taskId], updates);
              
              this.timeList.refreshCells();
              this.questList.refreshList();
              if (!taskId.startsWith('quest-')) {
                  TaskService.update(taskId, updates).catch(e=>e);
              }
          }
      });
      await this.questSettings.render(this.element.querySelector('#col-settings'), 'replace');
  }

  // ============================================
  // ЛОГІКА ОРКЕСТРАЦІЇ
  // ============================================
  setActiveQuest(taskId) {
     this.state.activeQuestId = taskId;
     
     // Оновлення стану відстеження дочірніх елементів
     if (this.timeList) {
         this.timeList.props.activeQuestId = taskId;
         this.timeList.updateActiveQuestHighlight();
     }
     if (this.questList) {
         this.questList.props.activeQuestId = taskId;
         this.questList.refreshList();
     }
     if (this.questSettings) {
         this.questSettings.props.activeQuestId = taskId;
         this.questSettings.renderDetails();
     }
  }

  // ============================================
  // ЗБЕРЕЖЕННЯ ДАНИХ (СТАДІЯ 2: API БЕКЕНДУ)
  // ============================================
  async loadState() {
     try {
         const data = await TaskService.fetchAll();
         if (data) {
             this.state.questsData = data.items || {};
             
             // Зворотна сумісність для відсутніх властивостей
             for (const [key, q] of Object.entries(this.state.questsData)) {
                 if (!q.media_assets) q.media_assets = [];
                 if (q.hour === undefined || q.hour === null) q.hour = 0;
                 if (q.startM === undefined || q.startM === null) q.startM = 0;
                 if (q.durH === undefined || q.durH === null) q.durH = 1;
                 if (q.durM === undefined || q.durM === null) q.durM = 0;
                 if (!q.color) q.color = '#5c7482'; // Default timeline fallback color
                 if (q.completed === undefined || q.completed === null) q.completed = false;
                 if (q.archived === undefined || q.archived === null) q.archived = false;
             }
             
             // Кількість квестів для лічильника
             this.state.questCounter = Object.keys(this.state.questsData).length + 1;
         }
     } catch(e) {
         console.error("Failed to load quests from API", e);
     }
  }

  saveLocalState() {
     // Ми тепер не використовуємо єдиний save, а оновлюємо конкретні задачі при змінах
     // Але для зворотної сумісності з поточним кодом, будемо зберігати весь об'єкт у локал для надійності,
     // а справжні оновлення відправляти індивідуально (реалізовано в обробниках)
     if(this.saveDebounce) clearTimeout(this.saveDebounce);
     this.saveDebounce = setTimeout(() => {
         // Для повноцінної інтеграції краще відправляти PATCH запити в обробниках подій (onCreate, onUpdate)
         // Тому тут ми можемо залишити тільки локальний бекап або взагалі прибрати
         const storageKey = this.state.userId ? `eatpan_quests_v1_${this.state.userId}` : 'eatpan_quests_v1_guest';
         const payload = {
            quests: this.state.questsData,
            counter: this.state.questCounter,
            lastUpdated: new Date().toISOString()
         };
         localStorage.setItem(storageKey, JSON.stringify(payload));
     }, 400);
  }
}
