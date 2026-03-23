import Component from '../../../../core/Component.js';

export default class PageRight extends Component {
    template() {
        return `
            <section class="page page--right" id="recipe-page">
                <!-- BOTTOM RIBBONS -->
                <div class="bookmark-bottom-group">
                    <button class="bookmark-bottom prepared active" onclick="this.classList.toggle('active')"><i data-lucide="soup" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom planned" onclick="this.classList.toggle('active')"><i data-lucide="timer" style="width: 25px; height: 25px;"></i></button>
                </div>
                <!-- RIGHT SIDE INTERACTION TABS -->
                <aside class="side-tabs-container side-tabs--right">
                    <div class="side-tab--right">
                        <i data-lucide="heart" style="width: 16px;"></i><span class="side-tab-count">124</span>
                    </div>
                    <div class="side-tab--right"><i data-lucide="send" style="width: 16px;"></i></div>
                    <div class="side-tab--right">
                        <i data-lucide="repeat" style="width: 16px;"></i><span class="side-tab-count">42</span>
                    </div>
                    <div class="side-tab--right">
                        <i data-lucide="message-square" style="width: 16px;"></i><span class="side-tab-count">18</span>
                    </div>
                </aside>
                <div class="scrollable-area right-page-inner">
                    <header class="recipe-top-bar">
                        <div class="recipe-actions">
                            <button class="btn-recipe-action" style="min-width: 40px;"></button>
                            <button class="btn-recipe-status active" title="Блюдо в наявності" onclick="this.classList.toggle('active')">Приготовлено 26.04</button>
                            <button class="btn-recipe-action" onclick="const s = this.classList.toggle('active'); this.querySelector('span').innerText = s ? 'Заплановано' : 'Запланувати приготування'; this.querySelector('i').style.display = s ? 'inline-block' : 'none';">
                                <i data-lucide="timer" style="width: 14px; margin-right: 6px; display: none;"></i>
                                <span>Запланувати приготування</span>
                            </button>
                        </div>
                    </header>
                    <div class="hero-grid">
                        <div class="hero-meta">
                            <h1 class="text-h1">Курячі <br /><strong>Нагетси</strong></h1>
                            <p class="text-subtitle">(Хрусткі та дуже соковиті)</p>
                            <div class="recipe-stats">
                                <div class="stat-item"><i data-lucide="clock" style="width: 12px;"></i> 45 ХВ</div>
                                <div class="stat-item"><i data-lucide="users" style="width: 12px;"></i> 4 ПОРЦІЇ</div>
                            </div>
                        </div>
                        <div class="recipe-image-wrap">
                            <img alt="Recipe Preview" class="recipe-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAerQ8fBdViiOUbSqfZzbpJY1W13Q-cphA0pM-BTbphEkZ7X6TduOQ2JwjvTtNAYq31NvVLdSPSB21oTQFs-pPrnJ4EPu5uWbxPzjUIR5-hBws3cqqqSx4kjCC7jjm5sP-8yCVe-FI3Mkp1sbk8NIOWjV0NMrLpbFh5W2Rh0Eszd4QgmqySCXqZ8U2iJjNyTOcGztA-j4FwyKHFG4YuY6mXRDHCLuw6GzDCVgMbKmF6oSgScf7sB5yx28W93js-L6NgBH7fpkiziQ82" />
                        </div>
                    </div>
                    <div class="details-grid">
                        <div class="details-col-left">
                            <section>
                                <h3 class="section-title">Інгредієнти</h3>
                                <ul class="ingredient-list">
                                    <li class="ingredient-item">
                                        <div class="ingredient-info">
                                            <img alt="Chicken" class="ingredient-icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK0E_P4XkP3Mi-Th3oHTSUcFFeA9mKK6ULYoFZSd77dwQ0wTA3efNjeQojiSOwSoN0wJVDbZ0D3vIAoVvLTdSoH4kUyRN0QsypWfYda9CZ40jOpxrDetSUdlrFohr2NuncHvKiOOQBQNfSE3W3zwhMW1_1LVT4ArErZiFkWBHyi7jKAzMfV3JIFAzb0X_X5jXKX3R9ilCHy5UlBjm1gU_9K_-0EaFW9I47sDh8szLaKSYVsXzpKI6VG4Tex1f1jDXNTTRZlyIyJEJD" />
                                            <span>Куряче філе</span>
                                        </div>
                                        <span class="ingredient-amt">500г</span>
                                    </li>
                                    <li class="ingredient-item">
                                        <div class="ingredient-info">
                                            <img alt="Ginger" class="ingredient-icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKovzf6PItVLDwEJW-_w9ofr7lrLphKoLLJYYcCfbIJcuTiLTWTDFASKrQ0zRi2YisTzY5X4hkLIvYN5sVfDs8t2myihGJsjZAyEsWniJ5RUuUqTWhjvaDbXB4P9FBsIuGk81JzIxNmoUWahKpwayd4oDBvKaDU5jm0_IUfm2lfQVVmQvt6sM8fvO4W2ovx67ySxMVSdYJ0z-Fwy_gQHSif3cmww1fCs84RiSySxOeiBaWttDWnah8rLb16NwSMN9WTllmQxearj2r" />
                                            <span>Імбирна паста</span>
                                        </div>
                                        <span class="ingredient-amt">1 ч.л.</span>
                                    </li>
                                    <li class="ingredient-item">
                                        <div class="ingredient-info">
                                            <img alt="Soy Sauce" class="ingredient-icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF6knehI_SBKRBEVcDIw6e1-D3xA1NkvWQAMO6P6ofVt1RW2BnaTaNvEGJT4MPpglEidq01QCmC5CczTUyw7bWSvvJZc-y-jD_bCadu-gehNRh-JvaleQ7ynSsgNZo0cCWTXi_IiRxiinnkO61Zh51oce_OV2HWvnUO5kxD1ucGLdNvsP0-lxdqw80xMtM0ha2wye0_sRFBJ3GoomnO-lvVEyFnR_B3ZfoX0bar4BjaXHVMlccX1-CcCUw705CifWkm2f-CEef5kI3" />
                                            <span>Соєвий соус</span>
                                        </div>
                                        <span class="ingredient-amt">1 ст.л.</span>
                                    </li>
                                    <li class="ingredient-item">
                                        <div class="ingredient-info">
                                            <img alt="Breadcrumbs" class="ingredient-icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT_bReqNdKs4RbI0gGNYxx62qf-AF9TR8UZaQskv7ZdABXVFvWGi9843othKdJfNggUr_WG9fy0HYpA6KuyZjnsTuumO-BaUMYU2Fddfxa7TEpNFz8NBAEnFK0w9a5bd-Du-urCqHZ0nbDEQ3czftAmFQkVD6DymkaCNBb7l9O7IEDEta_xFp__sVte_TYiSd4SvORefSxpxcH8JW3TosPSQP3MjLeDWU9JZ7qX4I1Xv9b_fA_0EWyiXpCQA-YNsgHpw-UuRMZVTkr" />
                                            <span>Паніровка</span>
                                        </div>
                                        <span class="ingredient-amt">100г</span>
                                    </li>
                                </ul>
                            </section>
                            <section class="secret-box">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                                    <i data-lucide="lightbulb" style="width: 14px; color: var(--accent);"></i>
                                    <span class="text-label" style="color: var(--accent);">Секрет шефа</span>
                                </div>
                                <p style="font-size: 11px; line-height: 1.5; font-family: var(--font-serif); font-style: italic;">Для ідеальної хрусткості обваляйте нагетси в сухарях двічі, охолодивши їх між етапами.</p>
                            </section>
                        </div>
                        <div class="details-col-right" style="border-left: 1px solid rgba(0,0,0,0.05); padding-left: 1rem; padding-right: 1.8rem;">
                            <section>
                                <h3 class="section-title">Процес</h3>
                                <div class="step-list">
                                    <div class="step-item"><div class="step-num">01</div><div><h5 class="step-title">Маринування</h5><p class="step-desc">Наріжте філе кубиками, змішайте зі спеціями та соусом. Залиште на 20 хвилин.</p></div></div>
                                    <div class="step-item"><div class="step-num">02</div><div><h5 class="step-title">Панірування</h5><p class="step-desc">Сформуйте нагетси, вмочіть у яйце, а потім щільно обваляйте в сухарях.</p></div></div>
                                    <div class="step-item"><div class="step-num">03</div><div><h5 class="step-title">Смаження</h5><p class="step-desc">Смажте у розігрітій олії до золотої скоринки (приблизно 4 хв з кожного боку).</p></div></div>
                                </div>
                            </section>
                            <section class="serving-box">
                                <h4 style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Рекомендація до подачі</h4>
                                <p style="opacity: 0.7;">"Подавайте гарячими з медово-гірчичним соусом або домашнім кетчупом для розкриття смаку."</p>
                            </section>
                        </div>
                    </div>
                </div>
                <!-- RIGHT SIDE VARIANT TABS -->
                <aside class="side-tabs-container side-tabs--right-bottom">
                    <div class="side-tab--right" title="Редагувати" onclick="window.toggleCreateRecipe()"><i data-lucide="feather" style="width: 16px;"></i></div>
                    <div class="side-tab--right" title="Роздрукувати"><i data-lucide="printer" style="width: 16px;"></i></div>
                    <div class="side-tab--right active"><span>1 в.</span></div>
                    <div class="side-tab--right"><span>2 в.</span></div>
                    <div class="side-tab--right" title="Додати варіант"><i data-lucide="plus" style="width: 16px;"></i></div>
                </aside>
                <!-- CREATE MODE OVERLAY -->
                <div class="create-mode-content">
                    <div class="create-recipe-form">
                        <input type="text" class="create-input-title" placeholder="Назва рецепту">
                        <input type="text" class="create-input-subtitle" placeholder="Короткий опис (напр. Хрусткі та соковиті)">
                        <div class="create-image-upload" onclick="this.querySelector('input[type=file]').click()">
                            <i data-lucide="image-plus" style="width:32px;height:32px;"></i>
                            <span>Додати фото</span>
                            <input type="file" accept="image/*" style="display:none;">
                        </div>
                        <div class="create-stats-row">
                            <div class="create-stat-input">
                                <i data-lucide="clock" style="width:14px;"></i>
                                <input type="text" placeholder="45 хв">
                            </div>
                            <div class="create-stat-input">
                                <i data-lucide="users" style="width:14px;"></i>
                                <input type="text" placeholder="4 порції">
                            </div>
                        </div>
                        <section>
                            <h3 class="section-title">Інгредієнти</h3>
                            <div id="create-ingredients-list">
                                <div class="create-ingredient-row">
                                    <input type="text" class="create-ing-name" placeholder="Інгредієнт">
                                    <input type="text" class="create-ing-amount" placeholder="К-сть">
                                    <button type="button" class="create-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
                                </div>
                            </div>
                            <button type="button" class="create-add-row-btn" onclick="window.addIngredientRow()">
                                <i data-lucide="plus" style="width:12px;"></i> Додати інгредієнт
                            </button>
                        </section>
                        <section>
                            <h3 class="section-title">Процес приготування</h3>
                            <div id="create-steps-list">
                                <div class="create-step-row">
                                    <div class="create-step-num">01</div>
                                    <div class="create-step-fields">
                                        <input type="text" placeholder="Назва кроку">
                                        <textarea placeholder="Опис кроку..." rows="2"></textarea>
                                    </div>
                                    <button type="button" class="create-remove-btn" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:12px;"></i></button>
                                </div>
                            </div>
                            <button type="button" class="create-add-row-btn" onclick="window.addStepRow()">
                                <i data-lucide="plus" style="width:12px;"></i> Додати крок
                            </button>
                        </section>
                        <section>
                            <h3 class="section-title">Секрет шефа</h3>
                            <textarea class="create-secret-textarea" placeholder="Порада або секрет приготування..." rows="2"></textarea>
                        </section>
                        <section>
                            <h3 class="section-title">Подача</h3>
                            <textarea class="create-serving-textarea" placeholder="Рекомендація до подачі..." rows="2"></textarea>
                        </section>
                        <div class="create-form-actions">
                            <button type="button" class="create-save-btn" onclick="window.saveRecipe()">
                                <i data-lucide="check" style="width:16px;"></i> Зберегти в книгу
                            </button>
                            <button type="button" class="create-cancel-btn" onclick="window.toggleCreateRecipe()">Скасувати</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}
