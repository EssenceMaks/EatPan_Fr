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

    template() {
        return `<div></div>`;
    }

    attachEvents() {}

    async onMount() {}

    async render() {
        this.element = this.createNode(this.template());
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
