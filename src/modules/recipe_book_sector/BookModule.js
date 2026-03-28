import Component from '../../core/Component.js';
import { RecipeService } from '../../api/RecipeService.js';
import Book from './components/layout/Book.js';

export default class BookModule extends Component {
    async onMount() {
        await this.loadData();
    }

    async loadData() {
        console.log('BookModule mounting... Fetching data.');
        this.recipes = await RecipeService.fetchAll();
        
        // Clear previous contents
        this.element.innerHTML = this.template();
        
        const book = new Book({ recipes: this.recipes });
        const bookElement = await book.render();
        
        this.element.appendChild(bookElement);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    template() {
        return `
            <div class="book-module-wrapper">
                <!-- Book will be injected here via onMount -->
            </div>
        `;
    }
}
