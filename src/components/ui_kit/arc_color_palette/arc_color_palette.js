import Component from '../../../core/Component.js';

/**
 * ArcColorPalette - RPG themed color picker
 */
export default class ArcColorPalette extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedColor: props.initialColor || '#c69b50',
    };
    this.onChange = props.onChange || (() => {});
  }

  async template() {
    const isSelected = (c) => (this.state.selectedColor.toLowerCase() === c.toLowerCase() ? 'selected' : '');
    
    // Check if custom color
    const builtinColors = [
      '#5B84B1', '#6F9BC4', '#8DB6D9', '#A9CCEA',
      '#558B7E', '#6DA396', '#86BBAF', '#A5D4C9',
      '#c69b50', '#CD6155', '#E59866', '#F0B27A',
      '#9B59B6', '#AF7AC5', '#C39BD3', '#D7BDE2'
    ];
    let customColor = builtinColors.find(c => c.toLowerCase() === this.state.selectedColor.toLowerCase()) 
                      ? '#ffffff' 
                      : this.state.selectedColor;

    return `
      <div class="arc-color-palette-container">
        <div class="arc-palette-row">
            <span class="arc-palette-label">FOCUS</span>
            <div class="arc-color-group">
                <div class="arc-color-swatch ${isSelected('#5B84B1')}" data-color="#5B84B1" style="background: #5B84B1;" title="Ocean Depth"></div>
                <div class="arc-color-swatch ${isSelected('#6F9BC4')}" data-color="#6F9BC4" style="background: #6F9BC4;" title="Ocean Wave"></div>
                <div class="arc-color-swatch ${isSelected('#8DB6D9')}" data-color="#8DB6D9" style="background: #8DB6D9;" title="Ocean Sky"></div>
                <div class="arc-color-swatch ${isSelected('#A9CCEA')}" data-color="#A9CCEA" style="background: #A9CCEA;" title="Ocean Mist"></div>
            </div>
        </div>

        <div class="arc-palette-row">
            <span class="arc-palette-label">HEALTH</span>
            <div class="arc-color-group">
                <div class="arc-color-swatch ${isSelected('#558B7E')}" data-color="#558B7E" style="background: #558B7E;" title="Forest Dark"></div>
                <div class="arc-color-swatch ${isSelected('#6DA396')}" data-color="#6DA396" style="background: #6DA396;" title="Forest Light"></div>
                <div class="arc-color-swatch ${isSelected('#86BBAF')}" data-color="#86BBAF" style="background: #86BBAF;" title="Mint"></div>
                <div class="arc-color-swatch ${isSelected('#A5D4C9')}" data-color="#A5D4C9" style="background: #A5D4C9;" title="Pale Mint"></div>
            </div>
        </div>

        <div class="arc-palette-row">
            <span class="arc-palette-label">ACTION</span>
            <div class="arc-color-group">
                <div class="arc-color-swatch ${isSelected('#c69b50')}" data-color="#c69b50" style="background: #c69b50;" title="Gold (Default)"></div>
                <div class="arc-color-swatch ${isSelected('#CD6155')}" data-color="#CD6155" style="background: #CD6155;" title="Crimson"></div>
                <div class="arc-color-swatch ${isSelected('#E59866')}" data-color="#E59866" style="background: #E59866;" title="Rust"></div>
                <div class="arc-color-swatch ${isSelected('#F0B27A')}" data-color="#F0B27A" style="background: #F0B27A;" title="Sand"></div>
            </div>
        </div>

        <div class="arc-palette-row">
            <span class="arc-palette-label">REST</span>
            <div class="arc-color-group">
                <div class="arc-color-swatch ${isSelected('#9B59B6')}" data-color="#9B59B6" style="background: #9B59B6;" title="Amethyst"></div>
                <div class="arc-color-swatch ${isSelected('#AF7AC5')}" data-color="#AF7AC5" style="background: #AF7AC5;" title="Lavender"></div>
                <div class="arc-color-swatch ${isSelected('#C39BD3')}" data-color="#C39BD3" style="background: #C39BD3;" title="Lilac"></div>
                <div class="arc-color-swatch ${isSelected('#D7BDE2')}" data-color="#D7BDE2" style="background: #D7BDE2;" title="Pale Violet"></div>
            </div>
        </div>

        <div class="arc-palette-row" style="margin-top: 4px;">
            <span class="arc-palette-label">CUSTOM</span>
            <div class="arc-color-group">
                <label class="arc-color-picker-label" title="Точний колір">
                    🎨
                    <input type="color" class="custom-color-input" value="${this.state.selectedColor && this.state.selectedColor.startsWith('#') ? this.state.selectedColor : '#5c7482'}" style="display: none;">
                </label>
            </div>
        </div>
      </div>
    `;
  }

  setEvents() {
    this.element.addEventListener('click', (e) => {
      const swatch = e.target.closest('.arc-color-swatch');
      if (swatch) {
          const swatches = this.element.querySelectorAll('.arc-color-swatch');
          swatches.forEach(s => s.classList.remove('selected'));
          swatch.classList.add('selected');
          
          const newColor = swatch.dataset.color;
          this.state.selectedColor = newColor;
          this.onChange(newColor);
      }
    });

    this.element.addEventListener('input', (e) => {
        if (e.target.classList.contains('custom-color-input')) {
            const swatches = this.element.querySelectorAll('.arc-color-swatch');
            swatches.forEach(s => s.classList.remove('selected'));
            
            const newColor = e.target.value;
            this.state.selectedColor = newColor;
            this.onChange(newColor);
        }
    });
  }
}
