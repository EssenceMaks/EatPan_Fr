import Component from '../../../../core/Component.js';
import { toggleLikeRecipe, getLikedRecipeIds } from '../../../profile/profileData.js';

export default class PageRight extends Component {
    template() {
        const recipeObj = this.props.recipe;
        
        // EMPTY STATE
        if (!recipeObj) {
            return `
                <section class="page page--right empty-recipe-state">
                    <div class="empty-state-content" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-main); opacity:0.6;">
                        <i data-lucide="chef-hat" style="width:64px; height:64px; margin-bottom:20px;"></i>
                        <h2 class="text-h2">Оберіть рецепт зі списку</h2>
                        <p class="text-subtitle">або створіть новий</p>
                    </div>
                </section>
            `;
        }

        // RECIPE STATE
        const data = recipeObj.data || {};
        const title = data.title || "Без назви";
        const subtitle = data.subtitle || "";
        const timeStr = data.time_str || "0 хв";
        const portionsStr = data.portions_str || "0 порцій";
        const ingredients = data.ingredients || [];
        const steps = data.steps || [];

        const likedIds = getLikedRecipeIds();
        const isLiked = likedIds.includes(String(recipeObj.id));

        // BUILD INGREDIENTS HTML
        const ingredientsHTML = ingredients.map(ing => `
                                    <li class="ingredient-item">
                                        <div class="ingredient-info">
                                            <!-- Using flask conical as placeholder for generic ingredient icons -->
                                            <i data-lucide="flask-conical" class="ingredient-icon" style="width: 18px; color: var(--accent); margin-right: 8px;"></i>
                                            <span>${ing.name || ''}</span>
                                        </div>
                                        <span class="ingredient-amt">${ing.amount || ''}</span>
                                    </li>
        `).join('');

        // BUILD STEPS HTML
        const stepsHTML = steps.map((st, i) => `
                                    <div class="step-item">
                                        <div class="step-num">${String(st.num || i+1).padStart(2, '0')}</div>
                                        <div>
                                            <h5 class="step-title">${st.title || 'Крок'}</h5>
                                            <p class="step-desc">${st.text || ''}</p>
                                        </div>
                                    </div>
        `).join('');

        return `
            <section class="page page--right" id="recipe-page">
                <!-- BOTTOM RIBBONS -->
                <div class="bookmark-bottom-group">
                    <button class="bookmark-bottom prepared active" onclick="this.classList.toggle('active')"><i data-lucide="soup" style="width: 25px; height: 25px;"></i></button>
                    <button class="bookmark-bottom planned" onclick="this.classList.toggle('active')"><i data-lucide="timer" style="width: 25px; height: 25px;"></i></button>
                </div>
                <!-- RIGHT SIDE TABS WRAPPER -->
                <aside class="right-tabs-wrapper">
                    <div class="side-tabs-container side-tabs--right">
                        <div class="side-tab--right ${isLiked ? 'active' : ''}" style="cursor: pointer; ${isLiked ? 'color: #d9534f;' : ''}" data-like-btn="${recipeObj.id}">
                            <i data-lucide="heart" style="width: 16px; ${isLiked ? 'fill: #d9534f;' : ''}"></i><span class="side-tab-count">${isLiked ? '1' : '0'}</span>
                        </div>
                        <div class="side-tab--right"><i data-lucide="send" style="width: 16px;"></i></div>
                        <div class="side-tab--right">
                            <i data-lucide="repeat" style="width: 16px;"></i><span class="side-tab-count">42</span>
                        </div>
                        <div class="side-tab--right">
                            <i data-lucide="message-square" style="width: 16px;"></i><span class="side-tab-count">18</span>
                        </div>
                    </div>
                    <div class="side-tabs-container side-tabs--right-bottom">
                        <div class="side-tab--right" title="Редагувати" onclick="window.openEditRecipe()"><i data-lucide="feather" style="width: 16px;"></i></div>
                        <div class="side-tab--right" title="Роздрукувати"><i data-lucide="printer" style="width: 16px;"></i></div>
                        <div class="side-tab--right active"><span>1 в.</span></div>
                        <div class="side-tab--right"><span>2 в.</span></div>
                        <div class="side-tab--right" title="Додати варіант"><i data-lucide="plus" style="width: 16px;"></i></div>
                    </div>
                </aside>
                <div class="scrollable-area right-page-inner">
                    <header class="recipe-top-bar">
                        <div class="recipe-actions">
                            <button class="btn-recipe-action" style="min-width: 40px;" onclick="window.clearActiveRecipe && window.clearActiveRecipe()"><i data-lucide="x" style="width: 14px;"></i></button>
                            <button class="btn-recipe-status active" title="Блюдо в наявності" onclick="this.classList.toggle('active')">Приготовлено 26.04</button>
                            <button class="btn-recipe-action" onclick="const s = this.classList.toggle('active'); this.querySelector('span').innerText = s ? 'Заплановано' : 'Запланувати приготування'; this.querySelector('i').style.display = s ? 'inline-block' : 'none';">
                                <i data-lucide="timer" style="width: 14px; margin-right: 6px; display: none;"></i>
                                <span>Запланувати приготування</span>
                            </button>
                        </div>
                    </header>
                    <div class="hero-grid">
                        <div class="hero-meta">
                            <h1 class="text-h1">${title}</h1>
                            <p class="text-subtitle">${subtitle ? `(${subtitle})` : ''}</p>
                            <div class="recipe-stats">
                                <div class="stat-item"><i data-lucide="clock" style="width: 12px;"></i> ${timeStr}</div>
                                <div class="stat-item"><i data-lucide="users" style="width: 12px;"></i> ${portionsStr}</div>
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
                                    ${ingredientsHTML}
                                </ul>
                            </section>
                            <section class="secret-box">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                                    <i data-lucide="lightbulb" style="width: 14px; color: var(--accent);"></i>
                                    <span class="text-label" style="color: var(--accent);">Секрет шефа</span>
                                </div>
                                <p style="font-size: 11px; line-height: 1.5; font-family: var(--font-serif); font-style: italic;">${data.secret || "Для ідеальної хрусткості обваляйте нагетси в сухарях двічі, охолодивши їх між етапами."}</p>
                            </section>
                        </div>
                        <div class="details-col-right" style="border-left: 1px solid rgba(0,0,0,0.05); padding-left: 1rem; padding-right: 1.8rem;">
                            <section>
                                <h3 class="section-title">Процес</h3>
                                <div class="step-list">
                                    ${stepsHTML}
                                </div>
                            </section>
                            <section class="serving-box">
                                <h4 style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Рекомендація до подачі</h4>
                                <p style="opacity: 0.7;">${data.serving || '"Подавайте гарячими з медово-гірчичним соусом або домашнім кетчупом для розкриття смаку."'}</p>
                            </section>
                        </div>
                    </div>
                </div>

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
                        <button type="button" id="btn-delete-recipe" onclick="window.deleteActiveRecipe()" class="create-save-btn" style="display:none; background:transparent; color:var(--brand-red); border:1px solid var(--brand-red); width:100%; margin-bottom: 10px; justify-content:center;">
                            <i data-lucide="trash-2" style="width:16px; margin-right:8px;"></i> Видалити рецепт
                        </button>
                        <div class="create-form-actions">
                            <button type="button" id="btn-save-recipe" class="create-save-btn" onclick="window.saveRecipe()">
                                <i data-lucide="check" style="width:16px;"></i> Зберегти в книгу
                            </button>
                            <button type="button" class="create-cancel-btn" onclick="window.toggleCreateRecipe()">Скасувати</button>
                        </div>
                    </div>
                </div>

            </section>
        `;
    }

    async onMount() {
        if(window.lucide) {
            window.lucide.createIcons({
                root: this.element
            });
        }

        const likeBtn = this.element.querySelector('[data-like-btn]');
        if (likeBtn) {
            likeBtn.addEventListener('click', async () => {
                const id = likeBtn.dataset.likeBtn;
                if (id) {
                    toggleLikeRecipe(id);
                    await this.update();
                }
            });
        }
    }
}
