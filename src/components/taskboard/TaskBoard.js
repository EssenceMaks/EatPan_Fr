import Component from '../../core/Component.js';
import { supabase } from '../../core/supabaseClient.js';
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

    // Sub-components
    this.timeList = null;
    this.questList = null;
    this.questSettings = null;
    
    // Timer for debouncing saves
    this.saveDebounce = null;
  }

  async onMount() {
    // Determine user context for storage (Stage 1 uses this as key)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      this.state.userId = session.user.id;
    }

    // Load State
    this.loadState();
    
    // Initialize components
    this.initTimeList();
    this.initQuestList();
    this.initQuestSettings();
  }

  // ============================================
  // TEMPLATING
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
  // INITIALIZERS
  // ============================================
  async initTimeList() {
      this.timeList = new TimeList({
          questsData: this.state.questsData,
          activeQuestId: this.state.activeQuestId,
          
          onCreate: (hour, startM, MathDurH, MathDurM) => {
              let title = `Квест ${this.state.questCounter}`;
              const taskId = 'quest-' + Date.now() + Math.random().toString(36).substring(2, 5);
              
              this.state.questsData[taskId] = {
                  title: title, desc: '', hour: hour, startM: startM, 
                  durH: MathDurH, durM: MathDurM, 
                  color: this.timeList.getRandomColor(), 
                  completed: false, archived: false, media_assets: []
              };
              this.state.questCounter++;
              
              this.timeList.injectTaskItemDOM(taskId, this.state.questsData[taskId]);
              this.setActiveQuest(taskId);
              this.saveLocalState();
          },

          onCreateText: (text, hour) => {
              const taskId = 'quest-' + Date.now();
              this.state.questsData[taskId] = {
                  title: text, desc: '', hour: hour, startM: 0, 
                  durH: 1, durM: 0, 
                  color: this.timeList.getRandomColor(), 
                  completed: false, archived: false, media_assets: []
              };
              this.state.questCounter++;
              
              this.timeList.injectTaskItemDOM(taskId, this.state.questsData[taskId]);
              this.saveLocalState();
              this.timeList.refreshCells();
              this.questList.refreshList();
          },

          onSelect: (taskId) => {
              this.setActiveQuest(taskId);
          },

          onUpdateHour: (taskId, newHour) => {
              this.state.questsData[taskId].hour = newHour;
              this.saveLocalState();
              this.timeList.refreshCells();
              if(this.state.activeQuestId === taskId) {
                 this.questSettings.renderDetails();
              }
              // Quests might have changed sorting order
              this.questList.refreshList();
          },

          onRandomizeColors: () => {
              for (let key in this.state.questsData) {
                  this.state.questsData[key].color = this.timeList.getRandomColor();
              }
              this.saveLocalState();
              this.timeList.refreshCells();
              this.questList.refreshList();
              if(this.state.activeQuestId) this.questSettings.renderDetails();
          },

          onToggleDone: (taskId) => {
              this.state.questsData[taskId].completed = !this.state.questsData[taskId].completed;
              this.saveLocalState();
              this.timeList.refreshCells();
              this.questList.refreshList();
          },

          onArchive: (taskId) => {
              this.state.questsData[taskId].archived = true;
              this.saveLocalState();
              this.timeList.refreshCells();
              this.questList.refreshList();
              if (this.state.activeQuestId === taskId) this.setActiveQuest(null);
          },

          onTrash: (taskId) => {
              delete this.state.questsData[taskId];
              this.saveLocalState();
              this.timeList.refreshCells();
              this.questList.refreshList();
              if (this.state.activeQuestId === taskId) this.setActiveQuest(null);
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
          getQuestData: (id) => this.state.questsData[id], // Pass accessor to get live reference
          onUpdate: (taskId, updates) => {
              if(!this.state.questsData[taskId]) return;
              Object.assign(this.state.questsData[taskId], updates);
              
              this.saveLocalState();
              this.timeList.refreshCells();
              this.questList.refreshList();
          }
      });
      await this.questSettings.render(this.element.querySelector('#col-settings'), 'replace');
  }

  // ============================================
  // ORCHESTRATION LOGIC
  // ============================================
  setActiveQuest(taskId) {
     this.state.activeQuestId = taskId;
     
     // Update children tracking state
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
  // PERSISTENCE (STAGE 1: LOCALSTORAGE)
  // ============================================
  loadState() {
     const storageKey = this.state.userId ? `eatpan_quests_v1_${this.state.userId}` : 'eatpan_quests_v1_guest';
     const saved = localStorage.getItem(storageKey);
     if (saved) {
         try {
             const data = JSON.parse(saved);
             this.state.questsData = data.quests || {};
             
             // Backwards-compatibility for missing array properties logically attached in current cycle
             for (const [key, q] of Object.entries(this.state.questsData)) {
                 if (!q.media_assets) q.media_assets = [];
             }
             
             this.state.questCounter = data.counter || 1;
         } catch(e) {
             console.error("Failed to parse quests from localStorage", e);
         }
     }
  }

  saveLocalState() {
     if(this.saveDebounce) clearTimeout(this.saveDebounce);
     this.saveDebounce = setTimeout(() => {
         const storageKey = this.state.userId ? `eatpan_quests_v1_${this.state.userId}` : 'eatpan_quests_v1_guest';
         const payload = {
            quests: this.state.questsData,
            counter: this.state.questCounter,
            lastUpdated: new Date().toISOString()
         };
         localStorage.setItem(storageKey, JSON.stringify(payload));
         console.trace('[TaskBoard] LocalState Auto-Saved');
     }, 400);
  }
}
