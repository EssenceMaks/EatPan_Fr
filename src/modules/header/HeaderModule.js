import Component from '../../core/Component.js';

export default class HeaderModule extends Component {
    constructor(props = {}) {
        super(props);
        this.menuBtn = null;
        this.backBtn = null;
        this.col3 = null;
        this.col4 = null;
        
        this.adaptMenuPosition = this.adaptMenuPosition.bind(this);
    }

    async template() {
        return `
            <div class="nav-buttons-cluster" id="navButtonsCluster" style="display: flex; gap: 0.5rem; align-items: center; justify-content: flex-end; position: relative;">
                <button class="btn btn-back" id="backBtn" type="button">
                    <i data-lucide="arrow-left"></i>
                </button>
                <button class="btn btn-menu" id="menuBtn" type="button">
                    <i data-lucide="menu"></i>
                </button>
            </div>
        `;
    }

    async onMount() {
        this.menuBtn = this.element.querySelector('#menuBtn');
        this.backBtn = this.element.querySelector('#backBtn');

        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => {
                if (window.goBack) window.goBack();
                else history.back();
            });
        }

        if (window.lucide) {
            window.lucide.createIcons({ root: this.element });
        }

        window.addEventListener('resize', this.adaptMenuPosition);
        
        this.adaptMenuPosition();
        
        window.HeaderModuleInstance = this;
    }

    adaptMenuPosition() {
        const isDesktop = window.innerWidth >= 1024;
        const desktopCol4 = document.getElementById('col-4-desktop');
        const mobileCol4 = document.getElementById('col-4-mobile');

        this.col4 = isDesktop ? desktopCol4 : mobileCol4;

        if (this.col4 && !this.col4.contains(this.element)) {
            this.col4.appendChild(this.element);
        }
    }

    triggerAdapt() {
        this.adaptMenuPosition();
    }
}
