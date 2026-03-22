import Component from '../../core/Component.js';
import { RecipeService } from '../../api/RecipeService.js';
import Book from './components/layout/Book.js';

export default class BookModule extends Component {
    async onMount() {
        console.log('BookModule mounting... Fetching data.');
        this.recipes = await RecipeService.fetchAll();
        
        const book = new Book({ recipes: this.recipes });
        const bookElement = await book.render();
        this.element.appendChild(bookElement);
    }

    template() {
        return `
            <div class="book-module-wrapper">
                <!-- Book will be injected here via onMount -->
            </div>
        `;
    }
}
