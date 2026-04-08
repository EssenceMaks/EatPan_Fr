import Component from '../../../core/Component.js';

export default class GearInput extends Component {
  constructor(props = {}) {
    super(props);
    // props: { placeholder, value, type: 'text'|'password'|'number' }
  }

  async template() {
    const type = this.props.type || 'text';
    const placeholder = this.props.placeholder || 'Введите текст...';
    const value = this.props.value || '';

    return `<input type="${type}" class="arc-gear-input" placeholder="${placeholder}" value="${value}">`;
  }
}
