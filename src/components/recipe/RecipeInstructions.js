import Component from '../../core/Component.js';

export default class RecipeInstructions extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeData = props.recipeData || {};
  }

  async template() {
    const d = this.recipeData || {};
    const steps = d.steps || d.instructions || [];

    if (!Array.isArray(steps) || steps.length === 0) {
      return `
        <div class="recipe-instructions-inner">
          <h3 class="steps-main-title">Інструкція</h3>
          <p style="text-align:center;opacity:0.5;font-style:italic;padding:20px;">Інструкція ще не додана</p>
        </div>
      `;
    }

    const stepsHtml = steps.map((step, i) => {
      const text = typeof step === 'string' ? step : (step.text || step.description || '');
      const num = String(i + 1).padStart(2, '0');
      return `
        <div class="arc-spark-ribbon arc-spark-ribbon--outward preparation-step-ribbon">
          <div class="arc-spark-ribbon__seal arc-spark-ribbon__seal--square step-number-seal">
            <span class="step-number-text">${num}</span>
          </div>
          <div class="arc-spark-ribbon__content step-text-content">
            ${text}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="recipe-instructions-inner">
        <h3 class="steps-main-title">Інструкція</h3>
        <div class="steps-list">
          ${stepsHtml}
        </div>
      </div>
    `;
  }
}
