import { StorageAPI } from './storage.js';

export async function initNotifications() {
    const btn = document.getElementById('notifications-btn');
    if (!btn) return;

    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'notifications-dropdown';
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        width: 320px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        margin-top: 0.5rem;
        padding: 1rem;
    `;

    // Wrap the button to position dropdown relative to it
    const wrapper = btn.parentElement;
    wrapper.style.position = 'relative';
    wrapper.appendChild(dropdown);

    let isVisible = false;

    // Toggle dropdown
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        isVisible = !isVisible;

        if (isVisible) {
            await renderNotifications();
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            isVisible = false;
            dropdown.style.display = 'none';
        }
    });

    document.addEventListener('appReady', updateBadge);

    async function getNotifications() {
        const notifications = [];
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Get Notification Preferences
        const prefsData = await StorageAPI.get('settings', 'notifPrefs');
        const prefs = prefsData ? prefsData.value : { hw: true, exams: true, revision: true };

        // Get Dismissed Notifications
        const dismissedData = await StorageAPI.get('settings', 'dismissedNotifs');
        const dismissed = dismissedData ? dismissedData.value : [];

        // 1. Homework Due Today or Overdue
        if (prefs.hw) {
            const homework = await StorageAPI.getAll('homework');
            const pendingHw = homework.filter(hw => hw.status !== 'Completed');

            pendingHw.forEach(hw => {
                const id = `hw_${hw.id}`;
                if (dismissed.includes(id)) return;

                if (hw.dueDate < todayStr) {
                    notifications.push({ id, type: 'danger', icon: 'fa-triangle-exclamation', title: 'Overdue Homework', desc: hw.title, time: 'Past due' });
                } else if (hw.dueDate === todayStr) {
                    notifications.push({ id, type: 'warning', icon: 'fa-clock', title: 'Homework Due Today', desc: hw.title, time: 'Today' });
                }
            });
        }

        // 2. Exams Today or Upcoming (next 3 days)
        if (prefs.exams) {
            const exams = await StorageAPI.getAll('exams');
            exams.forEach(ex => {
                const id = `exam_${ex.id}`;
                if (dismissed.includes(id)) return;

                const [y, m, d] = ex.date.split('-');
                const examDate = new Date(y, m - 1, d);
                examDate.setHours(0, 0, 0, 0);

                const diffTime = examDate - new Date(today.getFullYear(), today.getMonth(), today.getDate()).setHours(0, 0, 0, 0);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    notifications.push({ id, type: 'danger', icon: 'fa-award', title: 'Exam Today!', desc: ex.title, time: 'Today' });
                } else if (diffDays > 0 && diffDays <= 3) {
                    notifications.push({ id, type: 'info', icon: 'fa-award', title: 'Upcoming Exam', desc: `${ex.title} in ${diffDays} days`, time: 'Upcoming' });
                }
            });
        }

        // 3. Needs Revision Topics
        if (prefs.revision) {
            const topics = await StorageAPI.getAll('topics');
            const revisionTopics = topics.filter(t => t.needsRevision);
            if (revisionTopics.length > 0) {
                const id = 'revision_reminder';
                if (!dismissed.includes(id)) {
                    notifications.push({ id, type: 'primary', icon: 'fa-book-open', title: 'Revision Reminder', desc: `You have ${revisionTopics.length} topics flagged for revision.`, time: 'Ongoing' });
                }
            }
        }

        return notifications;
    }

    async function updateBadge() {
        const notifs = await getNotifications();
        let badge = btn.querySelector('.notif-badge');

        if (notifs.length > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background: var(--danger);
                    color: white;
                    font-size: 0.6rem;
                    font-weight: bold;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                btn.appendChild(badge);
                btn.style.position = 'relative'; // Ensure btn has position relative for absolute badge
            }
            badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
        } else if (badge) {
            badge.remove();
        }
    }

    async function renderNotifications() {
        const notifs = await getNotifications();

        if (notifs.length === 0) {
            dropdown.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">
                    <i class="fa-regular fa-bell-slash" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p>All caught up!</p>
                </div>
            `;
            return;
        }

        let html = `
            <div style="font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                Notifications (${notifs.length})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        `;

        notifs.forEach(n => {
            const colorVar = n.type === 'danger' ? 'var(--danger)' : n.type === 'warning' ? 'var(--warning)' : n.type === 'info' ? 'var(--success)' : 'var(--accent-primary)';
            html += `
                <div style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.5rem; border-radius: var(--radius-sm); transition: background 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-primary)'" onmouseout="this.style.backgroundColor='transparent'">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${colorVar}20; color: ${colorVar}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fa-solid ${n.icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.125rem; display: flex; justify-content: space-between;">
                            ${n.title}
                            <button class="icon-btn dismiss-notif-btn" data-id="${n.id}" style="padding: 0; color: var(--text-secondary); width: 20px; height: 20px; font-size: 0.75rem;" title="Dismiss">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${n.desc}</div>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary); white-space: nowrap;">${n.time}</div>
                </div>
            `;
        });

        html += `</div>`;
        dropdown.innerHTML = html;

        dropdown.querySelectorAll('.dismiss-notif-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;

                const dismissedData = await StorageAPI.get('settings', 'dismissedNotifs');
                const dismissed = dismissedData ? dismissedData.value : [];
                dismissed.push(id);

                await StorageAPI.save('settings', { key: 'dismissedNotifs', value: dismissed });
                await updateBadge();
                renderNotifications();
            });
        });
    }

    // Handle settings UI binding
    async function initSettingsBinding() {
        const hwCb = document.getElementById('notif-homework');
        const exCb = document.getElementById('notif-exams');
        const revCb = document.getElementById('notif-revision');
        if (!hwCb) return;

        const prefsData = await StorageAPI.get('settings', 'notifPrefs');
        if (prefsData?.value) {
            hwCb.checked = prefsData.value.hw !== false;
            exCb.checked = prefsData.value.exams !== false;
            revCb.checked = prefsData.value.revision !== false;
        }

        const savePrefs = async () => {
            const prefs = { hw: hwCb.checked, exams: exCb.checked, revision: revCb.checked };
            await StorageAPI.save('settings', { key: 'notifPrefs', value: prefs });
            updateBadge();
            if (isVisible) renderNotifications();
        };

        hwCb.addEventListener('change', savePrefs);
        exCb.addEventListener('change', savePrefs);
        revCb.addEventListener('change', savePrefs);
    }

    initSettingsBinding();

    // Initial badge update
    updateBadge();
}
