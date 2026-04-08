/**
 * EatPan Frontend v2 — Base Component
 * Vanilla JS component system (React-like, without React)
 *
 * Usage:
 *   class MyComp extends Component {
 *     async template() { return '<div>...</div>'; }
 *     async onMount() { ... }
 *     onDestroy() { ... }
 *   }
 */
export default class Component {
  /**
   * @param {Object} props — immutable props passed from parent
   */
  constructor(props = {}) {
    this.props = props;
    this.element = null;
    this._mounted = false;
  }

  /**
   * Override in subclass — return HTML string
   */
  async template() {
    return '<div></div>';
  }

  /**
   * Lifecycle: called after element is in the DOM
   */
  async onMount() {}

  /**
   * Lifecycle: called before element is removed
   */
  onDestroy() {}

  /**
   * Render component into target element
   * @param {HTMLElement} target — DOM node to mount into
   * @param {'innerHTML'|'appendChild'|'prepend'|'replace'} mode
   */
  async render(target, mode = 'innerHTML') {
    if (!target) {
      console.warn(`[Component] No target to render into`);
      return this;
    }

    const html = await this.template();

    // Parse HTML into element
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    this.element = wrapper.firstElementChild || wrapper;

    // Mount
    switch (mode) {
      case 'innerHTML':
        target.innerHTML = '';
        target.appendChild(this.element);
        break;
      case 'appendChild':
        target.appendChild(this.element);
        break;
      case 'prepend':
        target.prepend(this.element);
        break;
      case 'replace':
        target.replaceWith(this.element);
        break;
      default:
        target.appendChild(this.element);
    }

    this._mounted = true;
    await this.onMount();

    return this;
  }

  /**
   * Remove component from DOM
   */
  destroy() {
    this.onDestroy();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this._mounted = false;
  }

  /**
   * Query within component scope
   */
  $(selector) {
    return this.element?.querySelector(selector) || null;
  }

  $$(selector) {
    return this.element ? Array.from(this.element.querySelectorAll(selector)) : [];
  }

  /**
   * Re-render in place
   */
  async update() {
    if (!this.element || !this.element.parentNode) return;
    const parent = this.element.parentNode;
    this.onDestroy();
    const html = await this.template();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const newEl = wrapper.firstElementChild || wrapper;
    parent.replaceChild(newEl, this.element);
    this.element = newEl;
    this._mounted = true;
    await this.onMount();
  }
}
