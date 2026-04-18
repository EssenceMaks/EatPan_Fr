import Component from '../../core/Component.js';
import ArcColorPalette from '../ui_kit/arc_color_palette/arc_color_palette.js';

export default class QuestSettings extends Component {
  constructor(props) {
    super(props);
    this.colorPalette = null;
  }

  async template() {
    return `<div class="tb-details-col" id="quest-details-container"></div>`;
  }

  async onMount() {
    this.renderDetails();
  }

  async renderDetails() {
      if (!this._mounted) return;
      const container = this.element;
      
      const { activeQuestId, getQuestData } = this.props;
      const quest = activeQuestId && getQuestData ? getQuestData(activeQuestId) : null;

      if (!activeQuestId || !quest) {
          container.innerHTML = `<div class="empty-state">Виберіть або створіть квест на таймлайні</div>`;
          return;
      }

      container.innerHTML = `
        <div class="tb-sidebar-header">ДЕТАЛІ КВЕСТУ</div>
        
        <div class="tb-detail-row" style="margin-bottom: 15px;">
            <label>НАЗВА</label>
            <input type="text" class="tb-input" id="det-title" value="${quest.title}" style="margin-bottom: 5px;">
            <textarea class="tb-input" id="det-desc" placeholder="Опис">${quest.desc || ''}</textarea>
        </div>

        <!-- Слайдер 1: Хвилини ПОЧАТКУ -->
        <div class="tb-setup-row">
            <span class="tb-setup-label">Хвилини<br/>(Початок)</span>
            <div style="flex-grow: 1;">
               <input type="range" id="rangeStartMin" min="0" max="55" step="5" class="single-slider" />
            </div>
            <div style="width: 45px; display: flex; justify-content: flex-end;">
               <input type="number" id="inputStartMin" min="0" max="59" class="seamless-input tb-num-input" style="width: 30px; text-align: right; color: var(--text-gold); font-weight: bold; font-size: 13px;" />
            </div>
        </div>

        <!-- Слайдер 2: Діапазон ГОДИН -->
        <div class="tb-setup-row">
            <span class="tb-setup-label">Години</span>
            <div style="flex-grow: 1; display: flex; align-items: center;">
                <div class="range-slider">
                    <div id="rangeTrack" class="range-track"></div>
                    <input type="range" id="rangeStartHour" min="0" max="23" step="1" class="range-input" />
                    <input type="range" id="rangeEndHour" min="0" max="23" step="1" class="range-input" />
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; min-width: 85px; color: var(--text-gold); font-weight: bold; font-size: 13px;">
                <input type="number" id="inputStartHour" min="0" max="23" class="seamless-input tb-num-input" style="width: 20px;" />
                <span style="font-size: 11px;">:</span><input type="number" id="inputStartMinSec" min="0" max="59" class="seamless-input tb-num-input" style="width: 20px;" />
                <span style="font-size: 10px; margin: 0 4px;">-</span>
                <input type="number" id="inputEndHour" min="0" max="23" class="seamless-input tb-num-input" style="width: 20px;" />
                <span style="font-size: 11px;">:</span><input type="number" id="inputEndMinSec" min="0" max="59" class="seamless-input tb-num-input" style="width: 20px;" />
            </div>
        </div>

        <!-- Слайдер 3: Хвилини ЗАКІНЧЕННЯ -->
        <div class="tb-setup-row" style="margin-bottom: 10px;">
            <span class="tb-setup-label">Хвилини<br/>(Кінець)</span>
            <div style="flex-grow: 1;">
               <input type="range" id="rangeEndMin" min="0" max="55" step="5" class="single-slider" />
            </div>
            <div style="width: 45px; display: flex; justify-content: flex-end;">
               <input type="number" id="inputEndMin" min="0" max="59" class="seamless-input tb-num-input" style="width: 30px; text-align: right; color: var(--text-gold); font-weight: bold; font-size: 13px;" />
            </div>
        </div>

        <!-- Результати -->
        <div class="tb-setup-results">
            <div>
               <div style="font-size: 9px; color: #5c7482; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Час квесту</div>
               <div style="color: var(--text-gold); font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; display: flex; align-items: baseline;">
                  <input type="number" id="manualStartHour" min="0" max="23" class="seamless-input tb-num-input" style="width: 28px; text-align: right; color: var(--text-gold); margin: 0; padding: 0" />:
                  <input type="number" id="manualStartMin" min="0" max="59" class="seamless-input tb-num-input" style="width: 28px; text-align: left; color: var(--text-gold); margin: 0; padding: 0" />
                  <span style="margin: 0 5px;">-</span>
                  <input type="number" id="manualEndHour" min="0" max="23" class="seamless-input tb-num-input" style="width: 28px; text-align: right; color: var(--text-gold); margin: 0; padding: 0" />:
                  <input type="number" id="manualEndMin" min="0" max="59" class="seamless-input tb-num-input" style="width: 28px; text-align: left; color: var(--text-gold); margin: 0; padding: 0" />
               </div>
            </div>
            <div style="text-align: right;">
               <div style="font-size: 9px; color: #5c7482; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Тривалість</div>
               <div style="color: white; font-family: 'Cinzel', serif; font-size: 16px; display: inline-flex; align-items: baseline;">
                  <span id="durHourWrapper"><input type="number" id="inputDurHour" min="0" max="24" class="seamless-input tb-num-input" style="width: 25px; text-align: right; color: white;" /> год</span>
                  <input type="number" id="inputDurMin" min="0" max="59" class="seamless-input tb-num-input" style="width: 25px; text-align: right; color: white; margin-left: 5px;" /> хв
               </div>
            </div>
        </div>
        
        <div class="tb-detail-row" style="margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <label>КОЛІР КВЕСТУ</label>
                <div id="det-current-color" style="width: 14px; height: 14px; border-radius: 2px; background: ${quest.color}; border: 1px solid var(--gold-dark); box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>
            </div>
            <div id="palette-mount" style="padding: 10px 0;"></div>
        </div>
      `;

      const paletteMount = container.querySelector('#palette-mount');
      if (paletteMount) {
          if (this.colorPalette) {
              this.colorPalette.destroy();
          }
          this.colorPalette = new ArcColorPalette({
              initialColor: quest.color,
              onChange: (newColor) => {
                  const swatch = container.querySelector('#det-current-color');
                  if(swatch) swatch.style.background = newColor;
                  this.updateQuest({ color: newColor });
              }
          });
          await this.colorPalette.render(paletteMount, 'innerHTML');
          this.colorPalette.setEvents();
      }

      this.bindDetailsEvents();
  }

  updateQuest(updates) {
     if(this.props.onUpdate) {
         this.props.onUpdate(this.props.activeQuestId, updates);
     }
  }

  bindDetailsEvents() {
      const container = this.element;
      
      const { activeQuestId, getQuestData } = this.props;
      const data = activeQuestId && getQuestData ? getQuestData(activeQuestId) : null;
      if (!data) return;

      const titleInp = container.querySelector('#det-title');
      const descInp = container.querySelector('#det-desc');
      
      titleInp.addEventListener('change', (e) => this.updateQuest({ title: e.target.value }));
      descInp.addEventListener('change', (e) => this.updateQuest({ desc: e.target.value }));

      // Налаштування часових змінних
      let state = {
          startH: data.hour,
          startM: data.startM,
          endH: data.hour + data.durH + Math.floor((data.startM + data.durM) / 60),
          endM: (data.startM + data.durM) % 60
      };

      const els = {
          rangeStartHour: container.querySelector('#rangeStartHour'),
          rangeEndHour: container.querySelector('#rangeEndHour'),
          rangeTrack: container.querySelector('#rangeTrack'),
          inputStartHour: container.querySelector('#inputStartHour'),
          inputEndHour: container.querySelector('#inputEndHour'),
          inputStartMinSec: container.querySelector('#inputStartMinSec'),
          inputEndMinSec: container.querySelector('#inputEndMinSec'),
          
          rangeStartMin: container.querySelector('#rangeStartMin'),
          inputStartMin: container.querySelector('#inputStartMin'),
          
          rangeEndMin: container.querySelector('#rangeEndMin'),
          inputEndMin: container.querySelector('#inputEndMin'),
          
          manualStartHour: container.querySelector('#manualStartHour'),
          manualStartMin: container.querySelector('#manualStartMin'),
          manualEndHour: container.querySelector('#manualEndHour'),
          manualEndMin: container.querySelector('#manualEndMin'),

          inputDurHour: container.querySelector('#inputDurHour'),
          inputDurMin: container.querySelector('#inputDurMin'),
          durHourWrapper: container.querySelector('#durHourWrapper')
      };

      const updateUI = () => {
          if(state.endH < state.startH || (state.endH === state.startH && state.endM < state.startM)) {
              state.endH = state.startH;
              state.endM = state.startM;
          }

          els.rangeStartHour.value = state.startH;
          els.rangeEndHour.value = state.endH;
          els.inputStartHour.value = state.startH;
          els.inputEndHour.value = state.endH;
          
          els.rangeStartMin.value = state.startM;
          els.inputStartMin.value = state.startM;
          
          els.rangeEndMin.value = state.endM;
          els.inputEndMin.value = state.endM;

          let minVal = Math.min(state.startH, state.endH);
          let maxVal = Math.max(state.startH, state.endH);
          let percent1 = (minVal / 23) * 100;
          let percent2 = (maxVal / 23) * 100;
          
          if(els.rangeTrack) {
              els.rangeTrack.style.left = percent1 + "%";
              els.rangeTrack.style.width = (percent2 - percent1) + "%";
          }

          let startMinPercent = (state.startM / 55) * 100;
          els.rangeStartMin.style.background = `linear-gradient(to right, var(--square-bg) ${startMinPercent}%, var(--text-gold) ${startMinPercent}%)`;
          
          let endMinPercent = (state.endM / 55) * 100;
          els.rangeEndMin.style.background = `linear-gradient(to right, var(--text-gold) ${endMinPercent}%, var(--square-bg) ${endMinPercent}%)`;

          if(els.inputStartMinSec && document.activeElement !== els.inputStartMinSec) els.inputStartMinSec.value = state.startM.toString().padStart(2, '0');
          if(els.inputEndMinSec && document.activeElement !== els.inputEndMinSec) els.inputEndMinSec.value = state.endM.toString().padStart(2, '0');

          if(document.activeElement !== els.manualStartHour) els.manualStartHour.value = state.startH.toString().padStart(2, '0');
          if(document.activeElement !== els.manualStartMin) els.manualStartMin.value = state.startM.toString().padStart(2, '0');
          if(document.activeElement !== els.manualEndHour) els.manualEndHour.value = state.endH.toString().padStart(2, '0');
          if(document.activeElement !== els.manualEndMin) els.manualEndMin.value = state.endM.toString().padStart(2, '0');

          if(document.activeElement !== els.inputStartHour) els.inputStartHour.value = state.startH.toString().padStart(2, '0');
          if(document.activeElement !== els.inputStartMin) els.inputStartMin.value = state.startM.toString().padStart(2, '0');
          if(document.activeElement !== els.inputEndHour) els.inputEndHour.value = state.endH.toString().padStart(2, '0');
          if(document.activeElement !== els.inputEndMin) els.inputEndMin.value = state.endM.toString().padStart(2, '0');
          
          let totalStartMins = state.startH * 60 + state.startM;
          let totalEndMins = state.endH * 60 + state.endM;
          let diff = totalEndMins - totalStartMins;
          
          let dH = Math.floor(diff / 60);
          let dM = diff % 60;
          
          if(document.activeElement !== els.inputDurHour) els.inputDurHour.value = dH;
          if(document.activeElement !== els.inputDurMin || parseInt(els.inputDurMin.value) >= 60) els.inputDurMin.value = dM;
          if(els.durHourWrapper) els.durHourWrapper.style.display = (dH === 0) ? 'none' : 'inline';

          this.updateQuest({
             hour: state.startH,
             startM: state.startM,
             durH: dH,
             durM: dM
          });
      };

      updateUI();

      els.rangeStartHour.addEventListener('input', (e) => {
          state.startH = parseInt(e.target.value);
          let diff = (state.endH * 60 + state.endM) - (state.startH * 60 + state.startM);
          if(diff < 0) diff = 10;
          let newEnd = (state.startH * 60 + state.startM) + diff;
          state.endH = Math.floor(newEnd / 60) % 24;
          state.endM = newEnd % 60;
          updateUI();
      });

      els.rangeEndHour.addEventListener('input', (e) => {
          state.endH = parseInt(e.target.value);
          updateUI();
      });

      const bringToFront = (el, otherEl) => {
          el.style.zIndex = 5;
          otherEl.style.zIndex = 4;
      };

      els.rangeStartHour.addEventListener('mousedown', () => bringToFront(els.rangeStartHour, els.rangeEndHour));
      els.rangeStartHour.addEventListener('touchstart', () => bringToFront(els.rangeStartHour, els.rangeEndHour), {passive: true});
      els.rangeEndHour.addEventListener('mousedown', () => bringToFront(els.rangeEndHour, els.rangeStartHour));
      els.rangeEndHour.addEventListener('touchstart', () => bringToFront(els.rangeEndHour, els.rangeStartHour), {passive: true});

      els.inputStartHour.addEventListener('input', (e) => {
          let v = parseInt(e.target.value);
          if(!isNaN(v) && v >= 0 && v <= 23) { 
              let diff = (state.endH * 60 + state.endM) - (state.startH * 60 + state.startM);
              if(diff < 0) diff = 10;
              state.startH = v; 
              let newEnd = (state.startH * 60 + state.startM) + diff;
              state.endH = Math.floor(newEnd / 60) % 24;
              state.endM = newEnd % 60;
              updateUI(); 
          }
      });

      els.inputEndHour.addEventListener('input', (e) => {
          let v = parseInt(e.target.value);
          if(!isNaN(v) && v >= 0 && v <= 23) { state.endH = v; updateUI(); }
      });

      els.rangeStartMin.addEventListener('input', (e) => {
         let oldTotal = state.startH * 60 + state.startM;
         state.startM = parseInt(e.target.value);
         let diff = (state.endH * 60 + state.endM) - oldTotal;
         if(diff < 0) diff = 10;
         let newEnd = (state.startH * 60 + state.startM) + diff;
         state.endH = Math.floor(newEnd / 60) % 24;
         state.endM = newEnd % 60;
         updateUI();
      });
      const handleStartMinInput = (e) => {
         let v = parseInt(e.target.value);
         if(!isNaN(v) && v >= 0 && v < 60) {
             let oldTotal = state.startH * 60 + state.startM;
             state.startM = v;
             let diff = (state.endH * 60 + state.endM) - oldTotal;
             if(diff < 0) diff = 10;
             let newEnd = (state.startH * 60 + state.startM) + diff;
             state.endH = Math.floor(newEnd / 60) % 24;
             state.endM = newEnd % 60;
             updateUI();
         }
      };
      if(els.inputStartMin) els.inputStartMin.addEventListener('input', handleStartMinInput);
      if(els.inputStartMinSec) els.inputStartMinSec.addEventListener('input', handleStartMinInput);

      els.rangeEndMin.addEventListener('input', (e) => {
         state.endM = parseInt(e.target.value);
         updateUI();
      });
      const handleEndMinInput = (e) => {
         let v = parseInt(e.target.value);
         if(!isNaN(v) && v >= 0 && v < 60) { state.endM = v; updateUI(); }
      };
      if(els.inputEndMin) els.inputEndMin.addEventListener('input', handleEndMinInput);
      if(els.inputEndMinSec) els.inputEndMinSec.addEventListener('input', handleEndMinInput);

      // Поля вводу тривалості
      els.inputDurHour.addEventListener('input', (e) => {
         let v = parseInt(e.target.value);
         if(!isNaN(v) && v >= 0 && v <= 24) {
             let totalStartMins = state.startH * 60 + state.startM;
             let totalDiffMins = v * 60 + parseInt(els.inputDurMin.value || 0);
             let newEnd = totalStartMins + totalDiffMins;
             state.endH = Math.floor(newEnd / 60) % 24;
             state.endM = newEnd % 60;
             updateUI();
         }
      });
      els.inputDurMin.addEventListener('input', (e) => {
         let v = parseInt(e.target.value);
         if(!isNaN(v) && v >= 0) {
             let totalStartMins = state.startH * 60 + state.startM;
             let totalDiffMins = parseInt(els.inputDurHour.value || 0) * 60 + v;
             let newEnd = totalStartMins + totalDiffMins;
             state.endH = Math.floor(newEnd / 60) % 24;
             state.endM = newEnd % 60;
             updateUI();
         }
      });
      
      // Auto-validation for manual inputs
      const bindManual = (el, maxV, callback) => {
         el.addEventListener('change', (e) => {
             let v = parseInt(e.target.value);
             if(isNaN(v)) v = 0;
             if(v < 0) v = 0;
             if(v > maxV) v = maxV;
             e.target.value = v.toString().padStart(2, '0');
             callback(v);
             updateUI();
         });
      };
      
      bindManual(els.manualStartHour, 23, (v) => {
          let diff = (state.endH * 60 + state.endM) - (state.startH * 60 + state.startM);
          if(diff < 0) diff = 10;
          state.startH = v;
          let newEnd = (state.startH * 60 + state.startM) + diff;
          state.endH = Math.floor(newEnd / 60) % 24;
          state.endM = newEnd % 60;
      });
      bindManual(els.manualStartMin, 59, (v) => {
          let diff = (state.endH * 60 + state.endM) - (state.startH * 60 + state.startM);
          if(diff < 0) diff = 10;
          state.startM = v;
          let newEnd = (state.startH * 60 + state.startM) + diff;
          state.endH = Math.floor(newEnd / 60) % 24;
          state.endM = newEnd % 60;
      });
      bindManual(els.manualEndHour, 23, (v) => { state.endH = v; });
      bindManual(els.manualEndMin, 59, (v) => { state.endM = v; });
  }
}
