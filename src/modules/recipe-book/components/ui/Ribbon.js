import Component from '../../../../core/Component.js';

export default class Ribbon extends Component {
    template() {
        const { id, icon, active, position, count, label } = this.props;
        const activeClass = active ? 'active' : '';
        const positionClass = `side-tabs--${position} side-tab--${position.includes('left') ? 'left' : 'right'}`;

        return `
            <div class="side-tab ${positionClass} ${activeClass}" data-id="${id}">
                ${label || icon || id}
                ${count ? `<span class="side-tab-count">${count}</span>` : ''}
            </div>
        `;
    }

    attachEvents() {
        this.element.addEventListener('click', () => {
            if (this.props.onClick) {
                this.props.onClick(this.props.id);
            }
        });
    }
}
