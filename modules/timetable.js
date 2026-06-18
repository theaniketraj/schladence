import { StorageAPI } from './storage.js';
import { showModal, showConfirm, showAlert } from './modal.js';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function initTimetable() {
    const container = document.getElementById('timetable-content');
    const addBtn = document.getElementById('add-period-btn');
    if (!container) return;

    document.addEventListener('appReady', render);

    let config = await StorageAPI.get('settings', 'timetableConfig');
    if (!config) {
        config = { value: { days: 5, periods: 7 } };
    }

    // Wire up the config form
    const configForm = document.getElementById('timetable-config-form');
    if (configForm) {
        document.getElementById('config-days').value = config.value.days;
        document.getElementById('config-periods').value = config.value.periods;

        configForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const days = Number.parseInt(document.getElementById('config-days').value);
            const periods = Number.parseInt(document.getElementById('config-periods').value);
            await StorageAPI.save('settings', { key: 'timetableConfig', value: { days, periods } });
            await showAlert("Timetable configuration saved!", "OK", "success");
            document.dispatchEvent(new CustomEvent('appReady')); // Re-render timetable
        });
    }

    addBtn.addEventListener('click', async () => {
        let currentConfig = await StorageAPI.get('settings', 'timetableConfig') || { value: { days: 5, periods: 7 } };
        const ACTIVE_DAYS = ALL_DAYS.slice(0, currentConfig.value.days);
        const ACTIVE_PERIODS = Array.from({ length: currentConfig.value.periods }, (_, i) => i + 1);

        const subjects = await StorageAPI.getAll('subjects');
        if (subjects.length === 0) {
            await showConfirm("Please add a subject in the Subjects tab first.", "OK", "info");
            return;
        }

        const dayOptions = ACTIVE_DAYS.map(d => ({ label: d, value: d }));
        const periodOptions = ACTIVE_PERIODS.map(p => ({ label: `Period ${p}`, value: p }));
        const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }));

        const result = await showModal('Add Timetable Period', [
            { id: 'day', label: 'Day', type: 'select', options: dayOptions },
            { id: 'period', label: 'Period', type: 'select', options: periodOptions },
            { id: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions },
            { id: 'room', label: 'Room Number (Optional)', type: 'text', placeholder: 'E.g. 101', required: false }
        ]);

        if (!result) return;

        const newPeriod = {
            id: 'tt_' + Date.now(),
            day: result.day,
            period: Number.parseInt(result.period),
            subjectId: result.subjectId,
            room: result.room || ''
        };

        await StorageAPI.save('timetable', newPeriod);
        render();
    });

    async function render() {
        const timetableData = await StorageAPI.getAll('timetable');
        const subjects = await StorageAPI.getAll('subjects');

        let currentConfig = await StorageAPI.get('settings', 'timetableConfig') || { value: { days: 5, periods: 7 } };
        const ACTIVE_DAYS = ALL_DAYS.slice(0, currentConfig.value.days);
        const ACTIVE_PERIODS = Array.from({ length: currentConfig.value.periods }, (_, i) => i + 1);

        // Update grid template columns dynamically based on days
        let html = `<div class="timetable-grid" style="grid-template-columns: 80px repeat(${ACTIVE_DAYS.length}, 1fr);">`;

        // Header Row
        html += '<div class="tt-header"></div>';
        ACTIVE_DAYS.forEach(day => {
            html += `<div class="tt-header">${day}</div>`;
        });

        // Grid Rows
        ACTIVE_PERIODS.forEach(p => {
            html += `<div class="tt-time-col">Period ${p}</div>`;
            ACTIVE_DAYS.forEach(day => {
                const periodData = timetableData.find(t => t.day === day && t.period === p);
                html += `
                    <div class="tt-cell" data-day="${day}" data-period="${p}">
                        ${periodData ? createPeriodHTML(periodData, subjects) : ''}
                    </div>
                `;
            });
        });

        html += '</div>';
        container.innerHTML = html;

        setupDragAndDrop();
    }

    function createPeriodHTML(periodData, subjects) {
        const sub = subjects.find(s => s.id === periodData.subjectId) || { name: 'Unknown', color: 'var(--text-secondary)' };
        return `
            <div class="tt-period" draggable="true" data-id="${periodData.id}" style="border-left-color: ${sub.color}">
                <div class="tt-subject">${sub.name}</div>
                <div class="tt-room"><i class="fa-solid fa-location-dot"></i> Room: ${periodData.room}</div>
            </div>
        `;
    }

    function setupDragAndDrop() {
        const periods = container.querySelectorAll('.tt-period');
        const cells = container.querySelectorAll('.tt-cell');

        periods.forEach(p => {
            p.addEventListener('dragstart', () => p.classList.add('dragging'));
            p.addEventListener('dragend', () => p.classList.remove('dragging'));
        });

        cells.forEach(cell => {
            cell.addEventListener('dragover', e => {
                e.preventDefault();
                cell.classList.add('drag-over');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });

            cell.addEventListener('drop', async e => {
                e.preventDefault();
                cell.classList.remove('drag-over');

                const draggingElement = container.querySelector('.dragging');
                if (!draggingElement) return;

                const ttId = draggingElement.dataset.id;
                const newDay = cell.dataset.day;
                const newPeriod = Number.parseInt(cell.dataset.period);

                // Prevent dropping if there's already a period here
                if (cell.querySelector('.tt-period')) {
                    await showConfirm("This slot is already occupied. Delete or move the existing period first.", "Got it", "info");
                    return;
                }

                const ttData = await StorageAPI.get('timetable', ttId);
                if (ttData) {
                    ttData.day = newDay;
                    ttData.period = newPeriod;
                    await StorageAPI.save('timetable', ttData);
                    render();
                }
            });
        });
    }
}
