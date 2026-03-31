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
            <div>
                <button class="btn btn-menu" id="menuBtn" type="button">
                    <i data-lucide="menu"></i>
                </button>
                <button class="btn btn-back" id="backBtn" type="button">
                    <i data-lucide="arrow-left"></i>
                </button>
            </div>
        `;
    }

    async onMount() {
        // Extract the buttons from our wrapper
        this.menuBtn = this.element.querySelector('#menuBtn');
        this.backBtn = this.element.querySelector('#backBtn');

        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => {
                if (window.goBack) window.goBack();
                else history.back();
            });
        }

        // Initialize lucide icons for these buttons
        if (window.lucide) {
            window.lucide.createIcons({ root: this.element });
        }

        window.addEventListener('resize', this.adaptMenuPosition);
        
        // Push buttons to the correct slots
        this.adaptMenuPosition();
        
        // Because we moved elements out of this.element into Document directly,
        // we might leave the wrapper empty.
        if (this.element.parentNode) {
            this.element.style.display = 'none'; // hide the empty wrapper
        }
        
        window.HeaderModuleInstance = this;
    }

    adaptMenuPosition() {
        const isDesktop = window.innerWidth >= 1024;
        const desktopCol3 = document.getElementById('col-3-desktop');
        const desktopCol4 = document.getElementById('col-4-desktop');
        const mobileCol3 = document.getElementById('col-3-mobile');
        const mobileCol4 = document.getElementById('col-4-mobile');

        this.col3 = isDesktop ? desktopCol3 : mobileCol3;
        this.col4 = isDesktop ? desktopCol4 : mobileCol4;

        const isActive = document.body.classList.contains('active-mode') || document.body.classList.contains('clock-mode');

        if (isActive) {
            if (this.col3 && this.menuBtn && !this.col3.contains(this.menuBtn)) this.col3.appendChild(this.menuBtn);
            if (this.col4 && this.backBtn && !this.col4.contains(this.backBtn)) this.col4.appendChild(this.backBtn);
        } else {
            if (this.col4 && this.menuBtn && !this.col4.contains(this.menuBtn)) this.col4.appendChild(this.menuBtn);
            if (this.col4 && this.backBtn && !this.col4.contains(this.backBtn)) this.col4.appendChild(this.backBtn);
            
            // keep order: menuBtn then backBtn
            if (this.col4 && this.menuBtn && this.backBtn && this.col4.contains(this.menuBtn) && this.col4.contains(this.backBtn)) {
                this.col4.insertBefore(this.menuBtn, this.backBtn);
            }
        }
    }

    triggerAdapt() {
        this.adaptMenuPosition();
    }
}
