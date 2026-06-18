import { StorageAPI } from './storage.js';
import { showModal, showConfirm } from './modal.js';
import { Gamification } from './gamification.js';

export async function initHomework() {
    const container = document.getElementById('homework-content');
    const addBtn = document.getElementById('add-hw-btn');
    if (!container) return;

    document.addEventListener('appReady', render);

    addBtn.addEventListener('click', async () => {
        const subjects = await StorageAPI.getAll('subjects');
        const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }));
        subjectOptions.unshift({ label: 'No Subject (General)', value: '' });

        const result = await showModal('Add Homework / Task', [
            { id: 'title', label: 'Task Title', type: 'text', placeholder: 'E.g. Read Chapter 5', required: true },
            { id: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions },
            { id: 'dueDate', label: 'Due Date', type: 'date', value: new Date().toISOString().split('T')[0], required: true },
            { id: 'priority', label: 'Priority', type: 'select', options: [
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium', selected: true },
                { label: 'High', value: 'High' },
                { label: 'Critical', value: 'Critical' }
            ]}
        ]);

        if (!result) return;

        const hw = {
            id: 'hw_' + Date.now(),
            title: result.title,
            subjectId: result.subjectId,
            dueDate: result.dueDate,
            priority: result.priority,
            status: 'Pending'
        };
        await StorageAPI.save('homework', hw);
        render();
        document.dispatchEvent(new CustomEvent('appReady'));
    });

    async function render() {
        const homework = await StorageAPI.getAll('homework');
        const subjects = await StorageAPI.getAll('subjects');

        const cols = {
            'Pending': [],
            'In Progress': [],
            'Completed': [],
            'Missed': []
        };

        homework.forEach(hw => {
            if (cols[hw.status]) {
                cols[hw.status].push(hw);
            } else {
                cols['Pending'].push(hw);
            }
        });

        container.innerHTML = `
            <div class="kanban-board">
                ${Object.keys(cols).map(status => `
                    <div class="kanban-column" data-status="${status}">
                        <div class="kanban-header">
                            <span>${status}</span>
                            <span style="background: var(--border-color); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.8rem;">${cols[status].length}</span>
                        </div>
                        <div class="kanban-cards">
                            ${cols[status].map(hw => {
            const sub = subjects.find(s => s.id === hw.subjectId) || { name: 'No Subject', color: 'var(--text-secondary)' };
            return `
                                    <div class="kanban-card" draggable="true" data-id="${hw.id}">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                                            <div style="font-size: 0.75rem; color: ${sub.color}; font-weight: 600;">${sub.name}</div>
                                            <button class="icon-btn delete-hw-btn" data-id="${hw.id}" style="font-size: 0.75rem; padding: 2px; color: var(--text-secondary);" title="Delete Task">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                        <div style="font-weight: 500; margin-bottom: 0.5rem; line-height: 1.4;">${hw.title}</div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
                                            <span><i class="fa-regular fa-calendar"></i> ${hw.dueDate}</span>
                                            <span class="priority-badge priority-${hw.priority}">${hw.priority}</span>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        setupDragAndDrop();
        setupDeleteButtons();
    }

    function setupDeleteButtons() {
        container.querySelectorAll('.delete-hw-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.closest('button').dataset.id;
                const confirmed = await showConfirm("Permanently delete this task?", "Delete", "danger");
                if (confirmed) {
                    await StorageAPI.delete('homework', id);
                    render();
                    document.dispatchEvent(new CustomEvent('appReady')); // Update dashboard
                }
            });
        });
    }

    function setupDragAndDrop() {
        const cards = container.querySelectorAll('.kanban-card');
        const columns = container.querySelectorAll('.kanban-column');

        cards.forEach(card => {
            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', e => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async e => {
                e.preventDefault();
                column.classList.remove('drag-over');

                const draggingCard = container.querySelector('.dragging');
                if (!draggingCard) return;

                const newStatus = column.dataset.status;
                const hwId = draggingCard.dataset.id;

                // Update DB
                const hw = await StorageAPI.get('homework', hwId);
                if (hw && hw.status !== newStatus) {
                    hw.status = newStatus;
                    await StorageAPI.save('homework', hw);
                    
                    if (newStatus === 'Completed') {
                        await Gamification.addXP(10); // 10 XP for completing homework
                        if (typeof globalThis.showAlert === 'function') {
                            globalThis.showAlert("Task Completed! +10 XP", "Great job!", "success");
                        }
                    }

                    render();
                    document.dispatchEvent(new CustomEvent('appReady'));
                }
            });
        });
    }
}
