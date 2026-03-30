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

        const book = new Book({ recipes: this.recipes });
        await this.replaceContent(book, '[data-book-mount]');

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    template() {
        return `
            <div class="book-module-wrapper">
                <div class="book-module-slot" data-book-mount></div>
            </div>
        `;
    }
}
