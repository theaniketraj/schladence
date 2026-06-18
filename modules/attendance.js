import { StorageAPI } from './storage.js';
import { showModal, showAlert } from './modal.js';
import { Gamification } from './gamification.js';

export async function initAttendance() {
    const container = document.getElementById('attendance-content');
    if (!container) return;

    document.addEventListener('appReady', render);

    async function render() {
        const subjects = await StorageAPI.getAll('subjects');
        let attendanceData = await StorageAPI.getAll('attendance');

        // Ensure every subject has an attendance record
        for (const sub of subjects) {
            if (!attendanceData.some(a => a.id === sub.id)) {
                const newAtt = { id: sub.id, attended: 0, total: 0 };
                await StorageAPI.save('attendance', newAtt);
                attendanceData.push(newAtt);
            }
        }

        // Filter out attendance for deleted subjects (if any)
        attendanceData = attendanceData.filter(a => subjects.find(s => s.id === a.id));

        container.innerHTML = `
            <div class="attendance-grid">
                ${subjects.map(sub => {
            const att = attendanceData.find(a => a.id === sub.id);
            return createAttendanceCard(sub, att);
        }).join('')}
            </div>
        `;

        // Attach event listeners
        container.querySelectorAll('.mark-present').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                await updateAttendance(id, 1, 1);
            });
        });

        container.querySelectorAll('.mark-absent').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                await updateAttendance(id, 0, 1);
            });
        });

        container.querySelectorAll('.undo-att').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                const subName = subjects.find(s => s.id === id)?.name || id;
                const att = await StorageAPI.get('attendance', id);
                if (att) {
                    const result = await showModal(`Edit Attendance for ${subName}`, [
                        { id: 'attended', label: 'Total Classes Attended', type: 'number', value: att.attended.toString(), min: '0' },
                        { id: 'total', label: 'Total Classes Held', type: 'number', value: att.total.toString(), min: '0' }
                    ]);

                    if (!result) return;

                    const newAttended = Number.parseInt(result.attended);
                    const newTotal = Number.parseInt(result.total);

                    if (!Number.isNaN(newAttended) && !Number.isNaN(newTotal) && newTotal >= newAttended && newTotal >= 0 && newAttended >= 0) {
                        att.attended = newAttended;
                        att.total = newTotal;
                        await StorageAPI.save('attendance', att);
                        render();
                        document.dispatchEvent(new CustomEvent('appReady'));
                    } else {
                        showAlert("Invalid input. Total must be >= Attended, and both must be positive numbers.", "OK", "danger");
                    }
                }
            });
        });
    }

    async function updateAttendance(id, attendedDelta, totalDelta) {
        const att = await StorageAPI.get('attendance', id);
        if (att) {
            att.attended += attendedDelta;
            att.total += totalDelta;
            await StorageAPI.save('attendance', att);
            
            if (attendedDelta === 1) {
                await Gamification.addXP(5); // 5 XP for attending a class
            }

            render();
            document.dispatchEvent(new CustomEvent('appReady'));
        }
    }

    function createAttendanceCard(sub, att) {
        const percentage = att.total === 0 ? 0 : (att.attended / att.total) * 100;
        const formattedPercent = percentage.toFixed(1);

        let color = 'var(--success)';
        if (percentage < 75 && att.total > 0) color = 'var(--danger)';
        else if (percentage < 80 && att.total > 0) color = 'var(--warning)';

        // Calculations
        // X = 3T - 4A
        const needed = (3 * att.total) - (4 * att.attended);
        // Y = (4A - 3T) / 3
        const safeBunks = Math.floor((4 * att.attended - 3 * att.total) / 3);

        let statusHtml = '';
        if (att.total === 0) {
            statusHtml = `<div class="att-status" style="background: var(--bg-primary);">No classes logged yet</div>`;
        } else if (percentage < 75) {
            statusHtml = `<div class="att-status danger">Attend next <strong>${needed}</strong> classes to reach 75%</div>`;
        } else {
            statusHtml = `<div class="att-status success">Safe to bunk <strong>${Math.max(0, safeBunks)}</strong> classes</div>`;
        }

        return `
            <div class="card att-card" style="border-top: 4px solid ${sub.color || 'var(--accent-primary)'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin-bottom: 0.5rem;">${sub.name}</h3>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${color};">${att.total > 0 ? formattedPercent + '%' : 'N/A'}</div>
                </div>
                
                <div style="color: var(--text-secondary); font-size: 0.875rem;">
                    ${att.attended} / ${att.total} Classes Attended
                </div>

                <div class="att-progress-bg">
                    <div class="att-progress-bar" style="width: ${att.total > 0 ? percentage : 0}%; background-color: ${color};"></div>
                </div>

                ${statusHtml}

                <div class="att-actions">
                    <button class="btn mark-present" data-id="${sub.id}" style="background-color: rgb(16 185 129 / 0.1); color: var(--success);"><i class="fa-solid fa-check"></i> Present</button>
                    <button class="btn mark-absent" data-id="${sub.id}" style="background-color: rgb(239 68 68 / 0.1); color: var(--danger);"><i class="fa-solid fa-xmark"></i> Absent</button>
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="icon-btn undo-att" data-id="${sub.id}" style="font-size: 0.875rem; width: 100%; border-radius: var(--radius-md); background: var(--bg-primary);"><i class="fa-solid fa-pen"></i> Edit Baseline</button>
                </div>
            </div>
        `;
    }
}
