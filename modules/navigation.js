export function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active to clicked item
            item.classList.add('active');

            // Hide all sections
            viewSections.forEach(section => section.classList.remove('active'));

            // Show target section
            const targetId = item.dataset.target;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update URL hash
            globalThis.location.hash = targetId;

            // Close sidebar on mobile
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        });
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // Handle initial load and browser back/forward navigation
    function handleHashChange() {
        const hash = globalThis.location.hash.replace('#', '');
        if (hash) {
            const targetItem = Array.from(navItems).find(item => item.dataset.target === hash);
            if (targetItem && !targetItem.classList.contains('active')) {
                // Remove active from all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                targetItem.classList.add('active');

                // Hide all sections
                viewSections.forEach(section => section.classList.remove('active'));

                // Show target section
                const targetSection = document.getElementById(hash);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            }
        } else {
            // Default to dashboard if no hash
            navItems[0]?.click();
        }
    }

    globalThis.addEventListener('hashchange', handleHashChange);

    // Trigger on initial load
    handleHashChange();
}
