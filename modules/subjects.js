import { StorageAPI } from './storage.js';
import { showModal, showConfirm } from './modal.js';

export async function initSubjects() {
    const subjectsContent = document.getElementById('subjects-content');
    const addBtn = document.getElementById('add-subject-btn');
    if (!subjectsContent) return;

    document.addEventListener('appReady', renderSubjects);

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const colors = [
                {label: 'Blue', value: '#3b82f6'},
                {label: 'Red', value: '#ef4444'},
                {label: 'Green', value: '#10b981'},
                {label: 'Yellow', value: '#f59e0b'},
                {label: 'Purple', value: '#8b5cf6'}
            ];

            const result = await showModal('Add Subject', [
                { id: 'name', label: 'Subject Name', type: 'text', placeholder: 'E.g. Data Structures', required: true },
                { id: 'code', label: 'Subject Code', type: 'text', placeholder: 'E.g. CS201', required: false },
                { id: 'teacher', label: 'Teacher Name', type: 'text', placeholder: 'E.g. Dr. Smith', required: false },
                { id: 'credits', label: 'Credits', type: 'number', value: "3", min: "1", max: "10" },
                { id: 'color', label: 'Color Label', type: 'select', options: colors }
            ]);

            if (!result) return;

            const newSub = {
                id: 'sub_' + Date.now(),
                name: result.name,
                code: result.code || '',
                teacher: result.teacher || '',
                credits: Number.parseInt(result.credits) || 3,
                color: result.color,
                semester: ''
            };

            await StorageAPI.save('subjects', newSub);
            renderSubjects();
            document.dispatchEvent(new CustomEvent('appReady')); // Update dashboard
        });
    }

    async function renderSubjects() {
        const subjects = await StorageAPI.getAll('subjects');

        subjectsContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                ${subjects.map(sub => `
                    <div class="card" style="border-top: 4px solid ${sub.color || 'var(--accent-primary)'}; transition: transform 0.2s; cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="margin-bottom: 0.25rem;">${sub.name}</h3>
                                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">${sub.code}</div>
                            </div>
                            <button class="icon-btn delete-subject" data-id="${sub.id}" style="padding: 0; font-size: 1rem;" title="Delete Subject"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                            <div><i class="fa-solid fa-user"></i> ${sub.teacher}</div>
                            <div><i class="fa-solid fa-star"></i> ${sub.credits} Credits</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Delete subject handler
        subjectsContent.querySelectorAll('.delete-subject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const confirmed = await showConfirm("Delete this subject? This will NOT delete associated homework/attendance yet in this MVP.", "Delete Subject", "danger");
                if (confirmed) {
                    const id = e.target.closest('button').dataset.id;
                    await StorageAPI.delete('subjects', id);
                    renderSubjects();
                    document.dispatchEvent(new CustomEvent('appReady'));
                }
            });
        });
    }
}
