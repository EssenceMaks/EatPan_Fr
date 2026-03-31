export default class Component {
    constructor(props = {}) {
        this.props = props;
        this.element = null;
    }

    createNode(template) {
        const div = document.createElement('div');
        div.innerHTML = template.trim();
        return div.firstElementChild || div.firstChild;
    }

    getRenderTarget(selector = null) {
        if (!this.element) return null;
        return selector ? this.element.querySelector(selector) : this.element;
    }

    async replaceContent(content, selector = null) {
        const target = this.getRenderTarget(selector);
        if (!target) return null;

        let node = null;

        if (content && typeof content.render === 'function') {
            node = await content.render();
        } else if (typeof content === 'string') {
            node = this.createNode(content);
        } else if (typeof Node !== 'undefined' && content instanceof Node) {
            node = content;
        }

        target.replaceChildren();

        if (node) {
            target.appendChild(node);
        }

        return node;
    }

    template() {
        return `<div></div>`;
    }

    attachEvents() {}

    async onMount() {}

    async render() {
        const templateString = await this.template();
        this.element = this.createNode(templateString);
        this.attachEvents();
        await this.onMount();
        return this.element;
    }

    async update(newProps) {
        this.props = { ...this.props, ...newProps };
        const oldElement = this.element;
        const newElement = await this.render();
        if (oldElement && oldElement.parentNode) {
            oldElement.replaceWith(newElement);
        } else {
            this.element = newElement;
        }
    }
}
