import { StorageAPI } from './storage.js';
import { showModal, showConfirm } from './modal.js';

export async function initExams() {
    const container = document.getElementById('exams-content');
    const addBtn = document.getElementById('add-exam-btn');
    if (!container) return;

    document.addEventListener('appReady', render);

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const subjects = await StorageAPI.getAll('subjects');
            if (subjects.length === 0) {
                await showConfirm("Add a subject first in the Subjects tab.", "OK", "info");
                return;
            }

            const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }));

            const result = await showModal('Add Exam', [
                { id: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions },
                { id: 'title', label: 'Exam Title', type: 'text', placeholder: 'E.g. Midterm, Final', required: true },
                { id: 'date', label: 'Date', type: 'date', required: true },
                { id: 'syllabus', label: 'Syllabus topics (comma separated)', type: 'text', placeholder: 'E.g. Chapter 1, Graph Theory' }
            ]);

            if (!result) return;

            const syllabus = result.syllabus ? result.syllabus.split(',').map(s => ({ topic: s.trim(), completed: false })) : [];

            const exam = {
                id: 'exam_' + Date.now(),
                subjectId: result.subjectId,
                title: result.title,
                date: result.date,
                syllabus,
                marks: null
            };

            await StorageAPI.save('exams', exam);
            render();
            // Trigger calendar to map the new exam if desired, or just re-render
            document.dispatchEvent(new CustomEvent('appReady'));
        });
    }

    async function render() {
        const exams = await StorageAPI.getAll('exams');
        const subjects = await StorageAPI.getAll('subjects');

        exams.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (exams.length === 0) {
            container.innerHTML = `<div class="empty-state">No exams scheduled. Relax!</div>`;
            return;
        }

        let html = '<div class="exams-grid">';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        exams.forEach(exam => {
            const sub = subjects.find(s => s.id === exam.subjectId) || { name: 'Unknown', color: 'var(--text-secondary)' };

            // Adjust examDate to local timezone midnight to avoid off-by-one errors
            const [y, m, d] = exam.date.split('-');
            const examDate = new Date(y, m - 1, d);
            examDate.setHours(0, 0, 0, 0);

            const diffTime = examDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let countdownHtml = '';
            let isPast = diffDays < 0;

            if (isPast) {
                countdownHtml = `<div class="exam-countdown past">Completed</div>`;
            } else if (diffDays === 0) {
                countdownHtml = `<div class="exam-countdown" style="background-color: var(--danger)">Today!</div>`;
            } else {
                countdownHtml = `<div class="exam-countdown">In ${diffDays} day${diffDays > 1 ? 's' : ''}</div>`;
            }

            const totalTopics = exam.syllabus.length;
            const completedTopics = exam.syllabus.filter(t => t.completed).length;
            const progressPercent = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

            html += `
                <div class="exam-card" style="border-top: 4px solid ${sub.color}">
                    <div class="exam-header">
                        <div>
                            <div class="exam-title">${exam.title}</div>
                            <div class="exam-meta">
                                <span style="color: ${sub.color}; font-weight: 500;">${sub.name}</span>
                                <span><i class="fa-regular fa-calendar"></i> ${exam.date}</span>
                            </div>
                        </div>
                        ${countdownHtml}
                    </div>

                    <div class="exam-syllabus-title">
                        <span>Syllabus Preparation</span>
                        <span>${progressPercent}%</span>
                    </div>
                    
                    <div class="exam-progress">
                        <div class="exam-progress-fill" style="width: ${progressPercent}%; background-color: ${progressPercent === 100 ? 'var(--success)' : 'var(--accent-primary)'}"></div>
                    </div>

                    <div class="syllabus-list">
                        ${exam.syllabus.length === 0 ? '<div style="font-size: 0.875rem; color: var(--text-secondary);">No topics added.</div>' : ''}
                        ${exam.syllabus.map((item, idx) => `
                            <label class="syllabus-item ${item.completed ? 'completed' : ''}">
                                <input type="checkbox" class="toggle-topic" data-exam-id="${exam.id}" data-idx="${idx}" ${item.completed ? 'checked' : ''}>
                                ${item.topic}
                            </label>
                        `).join('')}
                    </div>

                    <div class="exam-footer">
                        <div class="exam-marks">
                            ${exam.marks ? `Marks: <span style="color: var(--success); font-size: 1.1rem;">${exam.marks}</span>` : `<button class="btn add-marks-btn" data-id="${exam.id}" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Add Marks</button>`}
                        </div>
                        <button class="icon-btn delete-exam" data-id="${exam.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Bindings
        container.querySelectorAll('.toggle-topic').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const examId = e.target.dataset.examId;
                const idx = Number.parseInt(e.target.dataset.idx);
                const exam = await StorageAPI.get('exams', examId);
                if (exam) {
                    exam.syllabus[idx].completed = e.target.checked;
                    await StorageAPI.save('exams', exam);
                    render();
                }
            });
        });

        container.querySelectorAll('.add-marks-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const examId = e.target.dataset.id;
                const result = await showModal('Add Marks', [
                    { id: 'marks', label: 'Marks Obtained', type: 'text', placeholder: 'E.g. 85/100 or A+', required: true }
                ]);

                if (result) {
                    const exam = await StorageAPI.get('exams', examId);
                    if (exam) {
                        exam.marks = result.marks;
                        await StorageAPI.save('exams', exam);
                        render();
                    }
                }
            });
        });

        container.querySelectorAll('.delete-exam').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const confirmed = await showConfirm("Delete this exam record?", "Delete", "danger");
                if (confirmed) {
                    const id = e.target.closest('button').dataset.id;
                    await StorageAPI.delete('exams', id);
                    render();
                    document.dispatchEvent(new CustomEvent('appReady'));
                }
            });
        });
    }
}
