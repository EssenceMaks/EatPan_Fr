import Component from '../../../core/Component.js';

export default class ArcLightbox extends Component {
  constructor(props = {}) {
    super(props);
    this.images = props.images || []; // Array of URL strings
    this.currentIndex = props.initialIndex || 0;
    this.onClose = props.onClose || (() => {});
    
    // Swipe mechanics
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  async template() {
    if (this.images.length === 0) return '';

    const currentImg = this.images[this.currentIndex];
    const hasMultiple = this.images.length > 1;

    return `
      <div class="arc-lightbox-overlay" id="lightbox-bg">
        <button class="arc-lightbox-close" id="lightbox-close" title="Закрити (Esc)">
          <i data-lucide="x"></i>
        </button>

        <div class="arc-lightbox-content" id="lightbox-content">
          ${hasMultiple ? `
            <button class="arc-lightbox-btn prev" id="lightbox-prev" title="Назад (Left Arrow)">
              <i data-lucide="chevron-left"></i>
            </button>
          ` : ''}

          <img src="${currentImg}" class="arc-lightbox-image" id="lightbox-img" alt="Recipe photo">

          ${hasMultiple ? `
            <button class="arc-lightbox-btn next" id="lightbox-next" title="Вперед (Right Arrow)">
              <i data-lucide="chevron-right"></i>
            </button>
            <div class="arc-lightbox-counter">
              ${this.currentIndex + 1} / ${this.images.length}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async onMount() {
    if (window.lucide) lucide.createIcons({ root: this.element });

    // Animate in
    requestAnimationFrame(() => {
      if (this.element) this.element.classList.add('show');
    });

    // Event listeners
    const _el = this.element;
    _el.querySelector('#lightbox-close')?.addEventListener('click', () => this.close());
    _el.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox-bg' || e.target.id === 'lightbox-content') {
        this.close();
      }
    });

    if (this.images.length > 1) {
      this.$('#lightbox-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prev();
      });
      this.$('#lightbox-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.next();
      });

      // Swipe support
      const img = this.$('#lightbox-img');
      if (img) {
        img.addEventListener('touchstart', e => {
          this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        img.addEventListener('touchend', e => {
          this.touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe();
        }, { passive: true });
      }
    }

    // Keyboard support
    this._handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this._handleKeydown);

    // Lock body scroll
    document.body.style.overflow = 'hidden';
  }

  handleSwipe() {
    const swipeThreshold = 50;
    if (this.touchEndX < this.touchStartX - swipeThreshold) {
      this.next(); // swiped left
    }
    if (this.touchEndX > this.touchStartX + swipeThreshold) {
      this.prev(); // swiped right
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape') this.close();
    if (this.images.length > 1) {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    }
  }

  async prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    await this.update();
  }

  async next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    await this.update();
  }

  close() {
    if (this.element) this.element.classList.remove('show');
    
    document.removeEventListener('keydown', this._handleKeydown);
    document.body.style.overflow = '';
    
    setTimeout(() => {
      if (this.element) this.element.remove();
      this.onClose();
    }, 300); // Wait for fade out
  }
}
