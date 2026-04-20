export default class ShoppingExport {
    static async exportAsImage(container) {
        if (!window.html2canvas) {
            alert('Функція генерації зображень завантажується, спробуйте ще раз через секунду.');
            return null;
        }
        
        // Temporarily style for clean export
        const originalOverflow = container.style.overflowY;
        const originalMaxHeight = container.style.maxHeight;
        container.style.overflowY = 'visible';
        container.style.maxHeight = 'none';
        
        // Hide edit/delete buttons for export
        const actionButtons = container.querySelectorAll('button');
        actionButtons.forEach(b => b.style.display = 'none');
        
        try {
            const canvas = await html2canvas(container, {
                backgroundColor: '#f4e8d1', // Parchment color background for image
                scale: 2, // High DPI
                logging: false,
                useCORS: true
            });
            return canvas;
        } finally {
            // Restore styles
            container.style.overflowY = originalOverflow;
            container.style.maxHeight = originalMaxHeight;
            actionButtons.forEach(b => b.style.display = '');
        }
    }

    static async copyAsImage(container, btn) {
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;" class="lucide-spin"></i>';
        if (window.lucide) lucide.createIcons({root: btn});

        try {
            const canvas = await this.exportAsImage(container);
            if (!canvas) return;
            
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob is null');
                try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    alert("Список скопійовано як картинку! Тепер ви можете вставити його в Telegram (Ctrl+V / Cmd+V).");
                } catch (err) {
                    console.warn("Clipboard API failed", err);
                    alert("Не вдалося скопіювати картинку в буфер обміну. Можливо, ваш браузер не підтримує цю функцію.");
                }
            });
        } catch (e) {
            console.error("Copy image failed", e);
            alert("Не вдалося скопіювати картинку: " + e.message);
        } finally {
            btn.innerHTML = oldHtml;
            if (window.lucide) lucide.createIcons({root: btn});
        }
    }

    static async downloadAsImage(container, listId, btn) {
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;" class="lucide-spin"></i>';
        if (window.lucide) lucide.createIcons({root: btn});

        try {
            const canvas = await this.exportAsImage(container);
            if (!canvas) return;
            
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob is null');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `shopping-list-${listId}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        } catch (e) {
            console.error("Download image failed", e);
            alert("Не вдалося завантажити картинку: " + e.message);
        } finally {
            btn.innerHTML = oldHtml;
            if (window.lucide) lucide.createIcons({root: btn});
        }
    }

    static buildText(items) {
        if (!items || Object.keys(items).length === 0) return "Список порожній";
        let text = "Список покупок:\n\n";
        for (const [id, item] of Object.entries(items)) {
            text += `[✅ ][❌ ] \n`;
            text += `[ ] ${item.name} (x${item.quantity || 1} ${item.unit || 'шт'})\n`;
            if (item.notes) text += `    Примітки: ${item.notes}\n`;
            text += "\n";
        }
        return text.trimEnd() + "\n";
    }

    static async copyAsText(items) {
        const text = this.buildText(items);
        try {
            await navigator.clipboard.writeText(text);
            alert("Список скопійовано як текст!");
        } catch (err) {
            console.warn("Clipboard API failed", err);
            alert("Не вдалося скопіювати текст в буфер обміну.");
        }
    }

    static async downloadAsText(items, listId) {
        const text = this.buildText(items);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopping-list-${listId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
