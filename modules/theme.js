export function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check local storage for theme, or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.dataset.theme = savedTheme;
    } else if (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        htmlElement.dataset.theme = 'dark';
    }

    updateIcon();

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);

        updateIcon();
    });

    function updateIcon() {
        const currentTheme = htmlElement.dataset.theme;
        const icon = themeToggleBtn.querySelector('i');
        if (currentTheme === 'dark') {
            icon.className = 'fa-regular fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }
}
