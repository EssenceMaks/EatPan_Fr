import Component from '../../../core/Component.js';

export default class RecipeCategoryGrid extends Component {
  constructor(props = {}) {
    super(props);
    this.categories = props.categories || [];
    this.recipeCounts = props.recipeCounts || {};
    this.officialCategories = props.officialCategories || [];
    this.onSelectCategory = props.onSelectCategory || (() => {});
    
    this.catImgs = {
        "М'ясо": "https://lh3.googleusercontent.com/aida-public/AB6AXuCFQJX4a4czScihK-ImNo9rJk25Dadxma00W6aI8_EW2o4kSFlpqSqyPu82cyo4msu90zq2euVgVp7eRpfFITwHsXMANprRn3AQCMOUe_pzjZEA950_Oh7p6SQ9falr3Cej3ojb35QM3fDrxVVpQnvkAtwZBpfory0vZh2etpdnag3EfEuo7u_lrfBuHphba3ckh6Br_WmTqQK15ZQvaPZdEqssfo8QpWJcSgK_qKDYRAJpAYr3l4bzV85RXPifJRe_N15lVkzk9S2b",
        "Птиця": "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ4p8i0GofuBpQqrlpOb3iYCoNFO9hPt_oaI4Q5t2S-ZonDtEQ2jT-ARspcHAwwDyUC0o1cNap9SyvwwoN9n9uyA7a0-13KoUpMkBk87AMZ5a0UnKa5XiA3RWjIOxVlOWeXpHRZ2l9LWmzVpMk3cje49GIZuUesm2bDgTk3GoRLMd9IGkjDXRVhn--AdovqTwnD39mPgJOaGH3y4-9pjhaZrLiDHxlaGwKQUGW3Ai-T5Cipj7hi2fkLmW-Zk2cjCEbX1sdzLZE-0V-",
        "Паста": "https://lh3.googleusercontent.com/aida-public/AB6AXuBQmrfvgR4KaIXMFA7ntHy2Gz0DnWzWIjXcXRU8RmbPTtRelOa1zfZD7JZj_HrtOzcovTbia8ogFhYQI5IWUXYLE6yV0HQQJQlhEuTeCSH_x8ld0S_u_qzom5VbGJWTrcLWKITzcVg2O5mRkIIyzlGVhDSVEM3_qwuNQ3_NtWdJLAnDUXXxFYLjlIQefu6X8Dr1b0n9O7Hq-Rjbq1TO905pvIV8es1xQ-uIGd_OonIdQaENOZLRCT8N7J_6MgzVM20Jq6WDdpzdgYOK",
        "Супи": "https://images.unsplash.com/photo-1547592180-85f173990554",
        "Десерти": "https://images.unsplash.com/photo-1551024506-0baa27542c81",
        "Випічка": "https://images.unsplash.com/photo-1509365465994-3e811e5dc4b3",
        "Салати": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
        "Риба": "https://images.unsplash.com/photo-1544025162-8360980c6c7f",
    };
  }

  getRecipeWord(num) {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'рецептів';
    if (lastDigit === 1) return 'рецепт';
    if (lastDigit >= 2 && lastDigit <= 4) return 'рецепти';
    return 'рецептів';
  }

  async template() {
    const { resolveMediaUrl } = await import('../../../core/mediaResolver.js');

    const cards = this.categories.map(cat => {
      let img = this.catImgs[cat] || this.catImgs["Супи"]; // fallback
      
      // Attempt to resolve image_uuid from official DB categories
      const officialCat = this.officialCategories.find(c => c.data?.name === cat);
      if (officialCat?.data?.image_uuid) {
         img = resolveMediaUrl(officialCat.data.image_uuid);
      }

      const count = this.recipeCounts[cat] || 0;
      const countText = `${count} ${this.getRecipeWord(count)}`;
      
      return `
        <div class="arc-category-tile" data-cat="${cat}">
          <div class="arc-tile-badge">${countText}</div>
          <img alt="${cat}" class="arc-tile-img" src="${img}" />
          <div class="arc-tile-label">${cat}</div>
        </div>
      `;
    });

    return `
      <div class="rb-categories-grid">
        ${cards.join('')}
      </div>
    `;
  }

  async onMount() {
    this.$$('.arc-category-tile').forEach(tile => {
      tile.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-cat');
        this.onSelectCategory(cat);
      });
    });

    const grid = this.$('.rb-categories-grid');
    if (grid) {
      if (this.animationInterval) clearInterval(this.animationInterval);
      this.animationInterval = setInterval(() => {
        if (grid.querySelector('.arc-category-tile:hover')) return;
        const tiles = this.$$('.arc-category-tile');
        if (tiles.length === 0) return;
        
        const randIndex = Math.floor(Math.random() * tiles.length);
        const tile = tiles[randIndex];
        tile.classList.add('arc-hover-simulate');
        
        setTimeout(() => {
          if (tile && tile.isConnected) tile.classList.remove('arc-hover-simulate');
        }, 1500);
      }, 2000);
    }
  }

  updateData(categories, recipeCounts, officialCategories = []) {
    if (this.animationInterval) clearInterval(this.animationInterval);
    this.categories = categories;
    this.recipeCounts = recipeCounts;
    this.officialCategories = officialCategories;
    this.update();
  }
}
