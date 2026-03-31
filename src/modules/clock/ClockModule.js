import Component from '../../core/Component.js';

export default class ClockModule extends Component {
  constructor(props = {}) {
    super(props);
    this.DEG_PER_HOUR = 15;
    this.smallClock = null;
    this.bigClockFace = null;
    this.bigClockHand = null;
    this.bigTimeDisplay = null;
    this.clockBlock = null;
    this.placeholder = null;
    this.updateInterval = null;
  }

  async template() {
    try {
      const res = await fetch('./src/modules/clock/clock.html');
      return await res.text();
    } catch (e) {
      console.error('Failed to load clock template', e);
      return `<div></div>`;
    }
  }

  async onMount() {
    // Extract elements from our template
    const smallContainer = this.element.querySelector('#clock-container-template');
    const bigBlock = this.element.querySelector('#clockBlock');
    
    // Setup references
    this.smallClock = smallContainer.querySelector('#smallClock');
    this.placeholder = smallContainer.querySelector('.clock-placeholder');
    this.clockBlock = bigBlock;
    this.bigClockFace = bigBlock.querySelector('#bigClockFace');
    this.bigClockHand = bigBlock.querySelector('#bigClockHand');
    this.bigTimeDisplay = bigBlock.querySelector('#bigTimeDisplay');

    // Attach them to DOM where requested
    if (this.props.headerTarget) {
      const parent = document.querySelector(this.props.headerTarget);
      if (parent) {
        // give it the proper class
        smallContainer.className = 'clock-container';
        smallContainer.id = '';
        parent.appendChild(smallContainer);
      }
    }
    
    if (this.props.blockTarget) {
      const parent = document.querySelector(this.props.blockTarget);
      if (parent) {
        // insert before first original block, or anywhere sensible. 
        // main.js historically toggled this over everything else when active.
        const firstVisible = parent.firstElementChild;
        parent.insertBefore(this.clockBlock, firstVisible);
      }
    }

    this.createClockFace();
    
    this.updateSmallClock = this.updateSmallClock.bind(this);
    this.updateInterval = setInterval(this.updateSmallClock, 1000);
    this.updateSmallClock();

    // Attach local events
    this.smallClock.addEventListener('click', () => {
      // Typically `activateClock` was global, but now we can call it locally, 
      // or dispatch an event to main.js if it handles SPA layers
      if (window.activateClock) {
        window.activateClock(this);
      }
    });

    this.placeholder.addEventListener('click', () => {
      if (document.body.classList.contains('clock-mode')) {
        window.history.back();
      }
    });
    
    this.bigClockFace.addEventListener('click', (e) => {
      const rect = this.bigClockFace.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / (rect.width / 2);
      if (dist < 0.15) return;
      let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      const { hour, minute } = this.angleToTime(angle);
      this.setClockTime(hour, minute);
    });

    // Make references available to main if needed
    window.ClockModuleInstance = this;
  }

  hourToAngle(h, m) {
    return (((h - 12 + 24) % 24) * this.DEG_PER_HOUR + (m || 0) * 0.25) % 360;
  }

  angleToTime(deg) {
    deg = ((deg % 360) + 360) % 360;
    const totalMinutes = deg * 4;
    let offsetHours = Math.floor(totalMinutes / 60);
    let minutes = Math.round((totalMinutes % 60) / 5) * 5;
    if (minutes >= 60) { minutes = 0; offsetHours++; }
    const hour = (offsetHours + 12) % 24;
    return { hour, minute: minutes };
  }

  setClockTime(h, m) {
    const angle = this.hourToAngle(h, m);
    this.bigClockHand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    this.bigTimeDisplay.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  showCurrentTimeOnBigClock() {
    const now = new Date();
    this.setClockTime(now.getHours(), now.getMinutes());
  }

  createClockFace() {
    // Remove existing
    this.bigClockFace.querySelectorAll('.tick, .clock-label').forEach(el => el.remove());

    for (let i = 0; i < 24; i++) {
        const tick = document.createElement('div');
        tick.className = 'tick';
        if (i % 6 === 0) tick.classList.add('hour-tick');
        tick.style.transform = `translateX(-50%) rotate(${i * this.DEG_PER_HOUR}deg)`;
        this.bigClockFace.appendChild(tick);
    }

    const labels = [
        { hour: 12, text: '12:00' },
        { hour: 18, text: '18:00' },
        { hour: 0,  text: '0:00' },
        { hour: 6,  text: '6:00' },
        { hour: 23, text: '23:00' }
    ];
    labels.forEach(({ hour, text }) => {
        const angleDeg = this.hourToAngle(hour, 0);
        const rad = (angleDeg - 90) * Math.PI / 180;
        const r = 54;
        const label = document.createElement('div');
        label.className = 'clock-label';
        label.style.left = (50 + r * Math.cos(rad)) + '%';
        label.style.top  = (50 + r * Math.sin(rad)) + '%';
        label.textContent = text;
        this.bigClockFace.appendChild(label);
    });
  }

  updateSmallClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.smallClock.textContent = `${hours}:${minutes}`;
  }
}
