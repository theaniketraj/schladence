import { StorageAPI } from './storage.js';

export function initSearch() {
    const searchInput = document.querySelector('.header-search input');
    if (!searchInput) return;

    // Create a container for search results
    const searchContainer = document.createElement('div');
    searchContainer.className = 'global-search-results';
    searchContainer.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        max-height: 400px;
        overflow-y: auto;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        margin-top: 0.5rem;
    `;

    // Wrap the input so we can position the dropdown absolutely
    const wrapper = searchInput.parentElement;
    wrapper.style.position = 'relative';
    wrapper.appendChild(searchContainer);

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) {
            searchContainer.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(() => performSearch(query), 300);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            searchContainer.style.display = 'none';
        }
    });

    async function performSearch(query) {
        const results = [];

        // 1. Search Subjects
        const subjects = await StorageAPI.getAll('subjects');
        subjects.forEach(sub => {
            if (sub.name.toLowerCase().includes(query) || (sub.code?.toLowerCase().includes(query))) {
                results.push({ type: 'Subject', title: sub.name, desc: sub.code || '', target: 'subjects' });
            }
        });

        // 2. Search Homework
        const homework = await StorageAPI.getAll('homework');
        homework.forEach(hw => {
            if (hw.title.toLowerCase().includes(query)) {
                results.push({ type: 'Homework', title: hw.title, desc: `Due: ${hw.dueDate}`, target: 'homework' });
            }
        });

        // 3. Search Topics
        const topics = await StorageAPI.getAll('topics');
        topics.forEach(t => {
            if (t.topic.toLowerCase().includes(query)) {
                results.push({ type: 'Topic', title: t.topic, desc: `Date: ${t.date}`, target: 'topics' });
            }
        });

        // 4. Search Notes
        const notes = await StorageAPI.getAll('notes');
        notes.forEach(n => {
            if (n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)) {
                results.push({ type: 'Note', title: n.title, desc: n.content.substring(0, 50) + '...', target: 'notes' });
            }
        });

        // 5. Search Exams
        const exams = await StorageAPI.getAll('exams');
        exams.forEach(ex => {
            if (ex.title.toLowerCase().includes(query)) {
                results.push({ type: 'Exam', title: ex.title, desc: `Date: ${ex.date}`, target: 'exams' });
            }
        });

        renderResults(results);
    }

    function renderResults(results) {
        if (results.length === 0) {
            searchContainer.innerHTML = '<div style="padding: 1rem; color: var(--text-secondary); text-align: center;">No results found.</div>';
        } else {
            searchContainer.innerHTML = results.map(res => `
                <div class="search-result-item" data-target="${res.target}" style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;">
                    <div style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 600; margin-bottom: 0.25rem;">${res.type}</div>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${res.title}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${res.desc}</div>
                </div>
            `).join('');

            // Add hover effect & click navigation
            const items = searchContainer.querySelectorAll('.search-result-item');
            items.forEach(item => {
                item.addEventListener('mouseenter', () => item.style.backgroundColor = 'var(--bg-primary)');
                item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

                item.addEventListener('click', () => {
                    const target = item.dataset.target;
                    const navItem = document.querySelector(`.nav-item[data-target="${target}"]`);
                    if (navItem) {
                        navItem.click();
                        searchContainer.style.display = 'none';
                        searchInput.value = '';
                    }
                });
            });
        }
        searchContainer.style.display = 'block';
    }
}
