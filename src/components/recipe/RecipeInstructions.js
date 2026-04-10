import Component from '../../core/Component.js';

export default class RecipeInstructions extends Component {
  constructor(props = {}) {
    super(props);
    this.recipeData = props.recipeData || {};
  }

  async template() {
    return `
      <div class="recipe-instructions-inner">
        <h3 class="steps-main-title">Preparation Steps</h3>
        <div class="steps-list">
          
          <div class="arc-spark-ribbon arc-spark-ribbon--outward preparation-step-ribbon">
            <div class="arc-spark-ribbon__seal arc-spark-ribbon__seal--square step-number-seal">
              <span class="step-number-text">01</span>
            </div>
            <div class="arc-spark-ribbon__content step-text-content">
              Prepare the ingredients. Wash the fresh carrots and chop them into thin slices. Ensure your knife is sharp for a clean cut.
            </div>
          </div>

          <div class="arc-spark-ribbon arc-spark-ribbon--outward preparation-step-ribbon">
            <div class="arc-spark-ribbon__seal arc-spark-ribbon__seal--square step-number-seal">
              <span class="step-number-text">02</span>
            </div>
            <div class="arc-spark-ribbon__content step-text-content">
              Heat up the pan with a bit of butter. Gently fry the carrots for about 5 minutes until they begin to soften.
            </div>
          </div>

          <div class="arc-spark-ribbon arc-spark-ribbon--outward preparation-step-ribbon">
            <div class="arc-spark-ribbon__seal arc-spark-ribbon__seal--square step-number-seal">
              <span class="step-number-text">03</span>
            </div>
            <div class="arc-spark-ribbon__content step-text-content">
              Add the beef steak. Sear each side on high heat for 2 minutes to lock in the juices. Reduce the heat and cook to your desired level of doneness.
            </div>
          </div>

          <div class="arc-spark-ribbon arc-spark-ribbon--outward preparation-step-ribbon">
            <div class="arc-spark-ribbon__seal arc-spark-ribbon__seal--square step-number-seal">
              <span class="step-number-text">04</span>
            </div>
            <div class="arc-spark-ribbon__content step-text-content">
              <strong>Chef's Tip:</strong> Let the meat rest for at least 5 minutes before slicing. This keeps it incredibly tender!
            </div>
          </div>

        </div>
      </div>
    `;
  }
}
