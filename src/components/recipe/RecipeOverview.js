import Component from '../../core/Component.js';

export default class RecipeOverview extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeData = props.recipeData || {};
    this.onMoreDetails = props.onMoreDetails || (() => {});
  }

  async template() {
    return `
      <div class="recipe-view-container">
        <div class="recipe-scroll-area">
          <div class="recipe-inner-wrap">
            
            <div class="recipe-header-nav" style="flex-direction: column; text-align: center; border: none; padding-top: 16px;">
              <h2 style="font-family: var(--font-title, serif); font-size: 2.2rem; color: var(--ink);">Wild Boar Stew</h2>
              <p style="font-size: 0.95rem; color: #666; font-style: italic;">A hearty meal for the cold nights</p>
            </div>

            <!-- Centaur Style Photo Gallery -->
            <div class="centaur-gallery">
              <div class="gallery-photo side-left">
                <div style="width:100%;height:100%;background:#805533;"></div>
              </div>
              <div class="gallery-photo side-right">
                <div style="width:100%;height:100%;background:#5a3c24;"></div>
              </div>
              <div class="gallery-photo main">
                 <div style="width:100%;height:100%;background:#a16e45;display:grid;place-items:center;color:white;font-family:var(--font-title);">Main Dish Photo</div>
              </div>
            </div>

            <!-- Ingredients List -->
            <div class="ingredients-section">
              <h3>Ingredients</h3>
              <div class="ingredients-grid">
                
                <!-- Ingredient 1: In Stock -->
                <div class="ing-card">
                  <div class="ing-icon-wrapper">
                    <i data-lucide="carrot" style="width: 32px; height: 32px;"></i>
                  </div>
                  <div class="ing-name" title="Fresh Carrots">Fresh Carrots</div>
                  <div class="ing-amounts">
                    <span class="ing-required-amount">5 pcs <span class="separator">|</span></span>
                    <span class="status-ok">
                      5/50 <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                    </span>
                  </div>
                </div>

                <!-- Ingredient 2: Partially missing (yellow) -->
                <div class="ing-card">
                  <div class="ing-icon-wrapper">
                    <i data-lucide="egg" style="width: 32px; height: 32px;"></i>
                  </div>
                  <div class="ing-name" title="Chicken Eggs">Chicken Eggs</div>
                  <div class="ing-amounts">
                    <span class="ing-required-amount">4 pcs <span class="separator">|</span></span>
                    <span class="status-missing warning">
                      4/2 <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
                    </span>
                  </div>
                </div>

                <!-- Ingredient 3: Missing totally (grey) -->
                <div class="ing-card">
                  <div class="ing-icon-wrapper">
                    <i data-lucide="milk" style="width: 32px; height: 32px;"></i>
                  </div>
                  <div class="ing-name" title="Almond Milk">Almond Milk</div>
                  <div class="ing-amounts">
                    <span class="ing-required-amount">1L <span class="separator">|</span></span>
                    <span class="status-missing">
                      1/0L <i data-lucide="circle" style="width: 16px; height: 16px;"></i>
                    </span>
                  </div>
                </div>

                <!-- Ingredient 4: In Stock -->
                <div class="ing-card">
                  <div class="ing-icon-wrapper">
                    <i data-lucide="leaf" style="width: 32px; height: 32px;"></i>
                  </div>
                  <div class="ing-name" title="Basil">Basil</div>
                  <div class="ing-amounts">
                    <span class="ing-required-amount">10g <span class="separator">|</span></span>
                    <span class="status-ok">
                      10/50g <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Dynamic mount point for instructions to "roll down" -->
            <div id="recipe-instructions-mount" class="collapsed"></div>
            
          </div>
        </div>

        <!-- Action Buttons pinned at bottom -->
        <div class="recipe-actions-row">
          <button type="button" class="arc-glyph arc-glyph--convex" id="btn-plan-recipe">
            <i data-lucide="calendar-plus"></i> Запланувати
          </button>
          <button type="button" class="arc-glyph arc-glyph--convex" id="btn-more-details">
            <i data-lucide="scroll-text"></i> Детальна Інструкція
          </button>
        </div>
      </div>
    `;
  }

  async onMount() {
    const btn = this.$('#btn-more-details');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle the internal state instead of calling parent pushed substate
        const mount = this.$('#recipe-instructions-mount');
        if (mount.classList.contains('collapsed')) {
          mount.classList.remove('collapsed');
          mount.classList.add('expanded');
          btn.classList.remove('arc-glyph--convex');
          btn.classList.add('arc-glyph--concave');
          btn.innerHTML = '<i data-lucide="chevron-up"></i> Приховати';
          if (window.lucide) window.lucide.createIcons({ root: btn });
          this.onMoreDetails(mount);
        } else {
          mount.classList.remove('expanded');
          mount.classList.add('collapsed');
          btn.classList.remove('arc-glyph--concave');
          btn.classList.add('arc-glyph--convex');
          btn.innerHTML = '<i data-lucide="scroll-text"></i> Детальна Інструкція';
          if (window.lucide) window.lucide.createIcons({ root: btn });
        }
      });
    }
  }
}
