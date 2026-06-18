import { StorageAPI } from './storage.js';
import { showModal, showConfirm, showAlert } from './modal.js';
import { Gamification } from './gamification.js';

export async function initStudy() {
    const container = document.getElementById('study-content');
    const addBtn = document.getElementById('add-study-btn');
    if (!container) return;

    let timerInterval = null;
    let secondsLeft = 25 * 60; // 25 mins pomodoro default
    let isRunning = false;

    document.addEventListener('appReady', render);

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const subjects = await StorageAPI.getAll('subjects');
            const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }));
            subjectOptions.unshift({ label: 'General Study (No Subject)', value: '' });

            const result = await showModal('Plan Study Session', [
                { id: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions },
                { id: 'topic', label: 'Topic / Plan', type: 'text', placeholder: 'E.g. Revise Chapter 3', required: true },
                { id: 'duration', label: 'Planned Duration (minutes)', type: 'number', value: '60', min: '5', max: '600' }
            ]);

            if (!result) return;

            const session = {
                id: 'study_' + Date.now(),
                subjectId: result.subjectId,
                topic: result.topic,
                date: new Date().toISOString().split('T')[0],
                plannedDuration: Number.parseInt(result.duration) || 60,
                actualDuration: 0,
                completed: false
            };

            await StorageAPI.save('study', session);
            render();
            document.dispatchEvent(new CustomEvent('appReady'));
        });
    }

    async function render() {
        const sessions = await StorageAPI.getAll('study');
        const subjects = await StorageAPI.getAll('subjects');

        sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const pendingSessions = sessions.filter(s => !s.completed);
        const completedSessions = sessions.filter(s => s.completed);

        container.innerHTML = `
            <div class="study-grid">
                <!-- Pomodoro Timer -->
                <div class="timer-card">
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Pomodoro Timer</h3>
                    <div class="timer-display" id="timer-display">${formatTime(secondsLeft)}</div>
                    <div class="timer-controls">
                        <button class="btn-play" id="timer-play" title="Start"><i class="fa-solid fa-play"></i></button>
                        <button class="btn-pause" id="timer-pause" title="Pause"><i class="fa-solid fa-pause"></i></button>
                        <button class="btn-stop" id="timer-stop" title="Reset (25m)"><i class="fa-solid fa-rotate-right"></i></button>
                        <button class="btn-focus" id="timer-focus" title="Toggle Focus Mode"><i class="fa-solid fa-expand"></i></button>
                    </div>
                </div>

                <!-- Sessions List -->
                <div class="study-sessions-panel">
                    <h3 style="margin-bottom: 1rem;">Planned Sessions</h3>
                    <div class="session-list">
                        ${pendingSessions.length === 0 ? '<div class="empty-state">No planned sessions.</div>' : ''}
                        ${pendingSessions.map(s => createSessionHTML(s, subjects)).join('')}
                    </div>
                    
                    <h3 style="margin: 2rem 0 1rem 0;">Completed Sessions</h3>
                    <div class="session-list">
                        ${completedSessions.length === 0 ? '<div class="empty-state">No completed sessions yet.</div>' : ''}
                        ${completedSessions.map(s => createSessionHTML(s, subjects)).join('')}
                    </div>
                </div>
            </div>
        `;

        setupTimerControls();
        setupSessionActions();
    }

    function createSessionHTML(session, subjects) {
        const sub = subjects.find(s => s.id === session.subjectId) || { name: 'General', color: 'var(--text-secondary)' };
        return `
            <div class="session-card ${session.completed ? 'completed' : ''}" style="border-left: 4px solid ${sub.color}">
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${session.topic}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        <span style="color: ${sub.color}; font-weight: 500;">${sub.name}</span>
                        <span style="margin: 0 0.5rem;">&bull;</span>
                        <i class="fa-regular fa-clock"></i> ${session.plannedDuration} mins
                        ${session.completed ? ` (Actual: ${session.actualDuration} mins)` : ''}
                    </div>
                </div>
                <div>
                    ${!session.completed ? `
                        <button class="btn btn-primary mark-done" data-id="${session.id}" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">Complete</button>
                    ` : `
                        <button class="icon-btn delete-session" data-id="${session.id}"><i class="fa-solid fa-trash"></i></button>
                    `}
                </div>
            </div>
        `;
    }

    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function setupTimerControls() {
        const playBtn = container.querySelector('#timer-play');
        const pauseBtn = container.querySelector('#timer-pause');
        const stopBtn = container.querySelector('#timer-stop');
        const focusBtn = container.querySelector('#timer-focus');
        const display = container.querySelector('#timer-display');

        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                document.body.classList.toggle('focus-mode-active');
                const isFocus = document.body.classList.contains('focus-mode-active');
                focusBtn.innerHTML = isFocus ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
            });
        }

        playBtn.addEventListener('click', () => {
            if (!isRunning) {
                isRunning = true;
                timerInterval = setInterval(() => {
                    if (secondsLeft > 0) {
                        secondsLeft--;
                        display.textContent = formatTime(secondsLeft);
                    } else {
                        clearInterval(timerInterval);
                        isRunning = false;
                        new Notification("Pomodoro Complete", { body: "Time for a break!" });
                        Gamification.addXP(15); // 15 XP for a pomodoro session
                        showAlert("Pomodoro session complete! Take a break. (+15 XP)", "OK", "success");
                    }
                }, 1000);
            }
        });

        pauseBtn.addEventListener('click', () => {
            isRunning = false;
            clearInterval(timerInterval);
        });

        stopBtn.addEventListener('click', () => {
            isRunning = false;
            clearInterval(timerInterval);
            secondsLeft = 25 * 60;
            display.textContent = formatTime(secondsLeft);
        });
    }

    function setupSessionActions() {
        container.querySelectorAll('.mark-done').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const session = await StorageAPI.get('study', id);
                if (session) {
                    const result = await showModal('Complete Session', [
                        { id: 'actual', label: `Actual Minutes Studied for "${session.topic}"`, type: 'number', value: session.plannedDuration.toString() }
                    ]);

                    if (!result) return;

                    session.actualDuration = Number.parseInt(result.actual) || session.plannedDuration;
                    session.completed = true;
                    await StorageAPI.save('study', session);
                    await Gamification.addXP(20); // 20 XP for study session
                    render();
                    document.dispatchEvent(new CustomEvent('appReady')); // Sync dashboard logic if needed later
                }
            });
        });

        container.querySelectorAll('.delete-session').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const confirmed = await showConfirm("Delete this session record?", "Delete", "danger");
                if (confirmed) {
                    const id = e.target.closest('button').dataset.id;
                    await StorageAPI.delete('study', id);
                    render();
                    document.dispatchEvent(new CustomEvent('appReady'));
                }
            });
        });
    }
}
