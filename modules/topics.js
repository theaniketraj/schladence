import { StorageAPI } from './storage.js';
import { showModal, showConfirm } from './modal.js';

export async function initTopics() {
    const container = document.getElementById('topics-content');
    const addBtn = document.getElementById('add-topic-btn');
    if (!container) return;

    document.addEventListener('appReady', render);

    addBtn.addEventListener('click', async () => {
        const subjects = await StorageAPI.getAll('subjects');
        if (subjects.length === 0) {
            await showConfirm("Please add a subject in the Subjects tab first.", "OK", "info");
            return;
        }

        const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }));

        const result = await showModal('Log New Topic', [
            { id: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions },
            { id: 'topic', label: 'Topic Name', type: 'text', placeholder: 'E.g. Binary Search Trees', required: true },
            { id: 'concepts', label: 'Key Concepts (comma separated)', type: 'text', placeholder: 'E.g. Nodes, Edges, Traversal', required: false },
            { id: 'understanding', label: 'Understanding (1 - 5)', type: 'number', value: '3', min: '1', max: '5' },
            { id: 'needsRevision', label: 'Needs Revision Soon?', type: 'select', options: [
                { label: 'No', value: 'false' },
                { label: 'Yes', value: 'true' }
            ]}
        ]);

        if (!result) return;

        const newTopic = {
            id: 'topic_' + Date.now(),
            subjectId: result.subjectId,
            date: new Date().toISOString().split('T')[0],
            topic: result.topic,
            concepts: result.concepts || '',
            understanding: Number.parseInt(result.understanding) || 3,
            needsRevision: result.needsRevision === 'true'
        };

        await StorageAPI.save('topics', newTopic);
        render();
    });

    async function render() {
        const topicsData = await StorageAPI.getAll('topics');
        const subjects = await StorageAPI.getAll('subjects');

        // Sort by date descending
        topicsData.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (topicsData.length === 0) {
            container.innerHTML = `<div class="empty-state">No topics logged yet. Start tracking what you learned in your classes!</div>`;
            return;
        }

        let html = '<div class="timeline">';

        topicsData.forEach(item => {
            const sub = subjects.find(s => s.id === item.subjectId) || { name: 'Unknown', color: 'var(--text-secondary)' };

            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<i class="fa-solid fa-star ${i > item.understanding ? 'empty' : ''}"></i>`;
            }

            html += `
                <div class="timeline-item">
                    <div class="timeline-dot" style="background-color: ${sub.color}"></div>
                    <div class="timeline-content">
                        <div class="topic-header">
                            <div>
                                <div class="topic-title">${item.topic}</div>
                                <div class="topic-meta" style="margin-top: 0.25rem;">
                                    <span style="color: ${sub.color}; font-weight: 500;">${sub.name}</span>
                                    <span><i class="fa-regular fa-calendar"></i> ${item.date}</span>
                                </div>
                            </div>
                            ${item.needsRevision ? '<span class="revision-badge"><i class="fa-solid fa-triangle-exclamation"></i> Needs Revision</span>' : ''}
                        </div>
                        
                        ${item.concepts ? `
                            <div class="topic-concepts">
                                <strong>Concepts:</strong> ${item.concepts}
                            </div>
                        ` : ''}

                        <div class="topic-footer">
                            <div class="understanding-stars">
                                <span style="color: var(--text-secondary); margin-right: 0.5rem;">Understanding:</span>
                                ${starsHtml}
                            </div>
                            <button class="icon-btn delete-topic" data-id="${item.id}" style="font-size: 1rem; padding: 0.25rem;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Delete handlers
        container.querySelectorAll('.delete-topic').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const confirmed = await showConfirm("Delete this topic record?", "Delete", "danger");
                if (confirmed) {
                    const id = e.target.closest('button').dataset.id;
                    await StorageAPI.delete('topics', id);
                    render();
                }
            });
        });
    }
}
