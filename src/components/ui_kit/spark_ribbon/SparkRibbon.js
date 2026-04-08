import Component from '../../../core/Component.js';

export default class SparkRibbon extends Component {
  constructor(props = {}) {
    super(props);
    // props: { title, desc, type: 'success'|'warning'|'error', 
    //          clip: 'inward'|'outward', dir: 'ltr'|'rtl',
    //          iconStyle: 'icon'|'seal'|'square-seal', icon: lucide-name }
  }

  async template() {
    const { title = 'Alert Title', desc = 'Description text', 
            type = 'success', clip = 'inward', dir = 'ltr',
            iconStyle = 'icon', icon = 'check' } = this.props;

    const clipClass = `arc-spark-ribbon--${clip}`;
    const dirClass = dir === 'rtl' ? ' arc-spark-ribbon--rtl' : '';

    let iconHtml = '';
    if (iconStyle === 'icon') {
      iconHtml = `<div class="arc-spark-ribbon__icon arc-spark-ribbon__icon--${type}"><i data-lucide="${icon}" style="width:18px;height:18px;"></i></div>`;
    } else if (iconStyle === 'seal') {
      iconHtml = `<div class="arc-spark-ribbon__seal"><i data-lucide="${icon}" style="width:18px;height:18px;"></i></div>`;
    } else if (iconStyle === 'square-seal') {
      iconHtml = `<div class="arc-spark-ribbon__seal arc-spark-ribbon__seal--square"><i data-lucide="${icon}" style="width:18px;height:18px;"></i></div>`;
    }

    return `
      <div class="arc-spark-ribbon ${clipClass}${dirClass}">
        <div class="arc-spark-ribbon__accent arc-spark-ribbon__accent--${type}"></div>
        ${iconHtml}
        <div class="arc-spark-ribbon__content">
          <div class="arc-spark-ribbon__title">${title}</div>
          <div class="arc-spark-ribbon__desc">${desc}</div>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });
  }
}
