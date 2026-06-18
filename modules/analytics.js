import { StorageAPI } from './storage.js';

export async function initAnalytics() {
    const container = document.getElementById('analytics-content');
    if (!container) return;

    document.addEventListener('appReady', render);

    async function render() {
        const homework = await StorageAPI.getAll('homework');
        const subjects = await StorageAPI.getAll('subjects');
        const study = await StorageAPI.getAll('study');
        const attendance = await StorageAPI.getAll('attendance');

        // --- 1. Homework Completion Donut Chart ---
        let hwCompleted = 0;
        let hwPending = 0;
        let hwMissed = 0;

        homework.forEach(hw => {
            if (hw.status === 'Completed') hwCompleted++;
            else if (hw.status === 'Missed') hwMissed++;
            else hwPending++;
        });

        const totalHw = homework.length;
        const hwCompletionRate = totalHw === 0 ? 0 : Math.round((hwCompleted / totalHw) * 100);
        const hwPendingRate = totalHw === 0 ? 0 : Math.round((hwPending / totalHw) * 100);

        const hwConic = `conic-gradient(
            var(--success) 0% ${hwCompletionRate}%, 
            var(--warning) ${hwCompletionRate}% ${hwCompletionRate + hwPendingRate}%, 
            var(--danger) ${hwCompletionRate + hwPendingRate}% 100%
        )`;

        // --- 2. Subject Study Hours Bar Chart ---
        const studyBySubject = {};
        subjects.forEach(sub => studyBySubject[sub.id] = 0);
        studyBySubject['general'] = 0; // Track general study

        study.forEach(s => {
            if (s.completed && s.actualDuration !== undefined) {
                const sid = s.subjectId || 'general';
                if (studyBySubject[sid] !== undefined) {
                    studyBySubject[sid] += s.actualDuration;
                }
            }
        });

        const maxMins = Math.max(...Object.values(studyBySubject), 1); // Avoid div by 0
        const barChartHtml = Object.keys(studyBySubject).map(subId => {
            const mins = studyBySubject[subId];
            if (subId === 'general' && mins === 0) return ''; // Hide general if 0

            let name = 'General Study';
            let code = 'GEN';
            let color = 'var(--text-secondary)';

            if (subId !== 'general') {
                const sub = subjects.find(s => s.id === subId);
                if (sub) {
                    name = sub.name;
                    code = sub.code || sub.name.substring(0, 3);
                    color = sub.color;
                }
            }

            const heightPercent = Math.max((mins / maxMins) * 100, 5); // Ensure min height of 5% for visibility
            const hours = (mins / 60).toFixed(1);
            return `
                <div class="bar-col">
                    <div class="bar-tooltip">${hours} hrs</div>
                    <div class="bar-fill" style="height: ${mins > 0 ? heightPercent : 0}%; background-color: ${color}"></div>
                    <div class="bar-label" title="${name}">${code}</div>
                </div>
            `;
        }).join('');

        // --- 3. Attendance Overview ---
        let totalClasses = 0;
        let totalAttended = 0;
        attendance.forEach(att => {
            totalClasses += att.total;
            totalAttended += att.attended;
        });
        const overallAttPercent = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

        const attConic = `conic-gradient(
            var(--success) 0% ${overallAttPercent}%, 
            var(--border-color) ${overallAttPercent}% 100%
        )`;

        container.innerHTML = `
            <div class="analytics-grid">
                
                <!-- Homework Chart -->
                <div class="chart-card">
                    <div class="chart-title">Homework Completion</div>
                    ${totalHw === 0 ? '<div class="empty-state">No homework data</div>' : `
                        <div class="donut-chart-wrapper">
                            <div class="donut-chart" style="background: ${hwConic}">
                                <div class="donut-hole">${hwCompletionRate}%</div>
                            </div>
                            <div class="donut-legend">
                                <div class="legend-item"><div class="legend-color" style="background: var(--success)"></div> Completed (${hwCompleted})</div>
                                <div class="legend-item"><div class="legend-color" style="background: var(--warning)"></div> Pending (${hwPending})</div>
                                <div class="legend-item"><div class="legend-color" style="background: var(--danger)"></div> Missed (${hwMissed})</div>
                            </div>
                        </div>
                    `}
                </div>

                <!-- Attendance Chart -->
                <div class="chart-card">
                    <div class="chart-title">Overall Attendance</div>
                    ${totalClasses === 0 ? '<div class="empty-state">No attendance data</div>' : `
                        <div class="donut-chart-wrapper">
                            <div class="donut-chart" style="background: ${attConic}">
                                <div class="donut-hole">${overallAttPercent}%</div>
                            </div>
                            <div class="donut-legend">
                                <div class="legend-item"><div class="legend-color" style="background: var(--success)"></div> Attended (${totalAttended})</div>
                                <div class="legend-item"><div class="legend-color" style="background: var(--border-color)"></div> Missed (${totalClasses - totalAttended})</div>
                            </div>
                        </div>
                    `}
                </div>

                <!-- Study Hours Chart -->
                <div class="chart-card" style="grid-column: 1 / -1; min-height: 300px;">
                    <div class="chart-title">Study Time by Subject (Hours)</div>
                    ${Object.values(studyBySubject).every(v => v === 0) ? '<div class="empty-state">No completed study sessions logged</div>' : `
                        <div class="bar-chart">
                            ${barChartHtml}
                        </div>
                    `}
                </div>

            </div>
        `;
    }
}
