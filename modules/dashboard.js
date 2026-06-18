import { StorageAPI } from "./storage.js";

export async function initDashboard() {
    const dashboardContent = document.getElementById("dashboard-content");
    if (!dashboardContent) return;

    // Listen for custom event to update dashboard when needed
    document.addEventListener("appReady", renderDashboard);

    async function renderDashboard() {
        const subjects = await StorageAPI.getAll("subjects");
        const homework = await StorageAPI.getAll("homework");
        const attendance = await StorageAPI.getAll("attendance");
        const timetable = await StorageAPI.getAll("timetable");

        // 1. Pending Homework
        const pendingHw = homework
            .filter((hw) => hw.status === "Pending" || hw.status === "In Progress")
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // 2. Overall Attendance
        let totalClasses = 0;
        let totalAttended = 0;
        attendance.forEach((att) => {
            totalClasses += att.total;
            totalAttended += att.attended;
        });
        const overallAttPercent =
            totalClasses === 0
                ? 100
                : ((totalAttended / totalClasses) * 100).toFixed(1);

        // 3. Today's Classes
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const todayName = days[new Date().getDay()];
        let todaysClasses = timetable.filter((t) => t.day === todayName);
        todaysClasses.sort((a, b) => a.period - b.period);

        dashboardContent.innerHTML = `
            <div class="dashboard-grid-top">
                <div class="card stat-card" style="border-left: 4px solid var(--accent-primary);">
                    <div class="stat-icon"><i class="fa-solid fa-book"></i></div>
                    <div>
                        <h3>Total Subjects</h3>
                        <div class="stat-value">${subjects.length}</div>
                    </div>
                </div>
                <div class="card stat-card" style="border-left: 4px solid var(--warning);">
                    <div class="stat-icon" style="color: var(--warning); background: rgb(245 158 11 / 0.1);"><i class="fa-solid fa-list-check"></i></div>
                    <div>
                        <h3>Pending Tasks</h3>
                        <div class="stat-value">${pendingHw.length}</div>
                    </div>
                </div>
                <div class="card stat-card" style="border-left: 4px solid var(--success);">
                    <div class="stat-icon" style="color: var(--success); background: rgb(16 185 129 / 0.1);"><i class="fa-solid fa-user-check"></i></div>
                    <div>
                        <h3>Overall Attendance</h3>
                        <div class="stat-value">${overallAttPercent}%</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid-main">
                <!-- Today's Classes -->
                <div class="card">
                    <div class="card-header">
                        <h3 style="margin: 0;">Today's Classes (${todayName})</h3>
                    </div>
                    <div class="card-body">
                        ${todaysClasses.length > 0
                ? `
                            <ul class="class-list">
                                ${todaysClasses
                    .map((cls) => {
                        const sub = subjects.find(
                            (s) => s.id === cls.subjectId,
                        ) || {
                            name: "Unknown",
                            color: "var(--text-secondary)",
                        };
                        return `
                                        <li class="class-item" style="border-left-color: ${sub.color}">
                                            <div class="class-time">Period ${cls.period}</div>
                                            <div class="class-details">
                                                <div class="class-name">${sub.name}</div>
                                                <div class="class-room"><i class="fa-solid fa-location-dot"></i> Room: ${cls.room || "N/A"}</div>
                                            </div>
                                        </li>
                                    `;
                    })
                    .join("")}
                            </ul>
                        `
                : `<div class="empty-state">No classes scheduled for today! Enjoy your day.</div>`
            }
                    </div>
                </div>

                <!-- Upcoming Deadlines -->
                <div class="card">
                    <div class="card-header">
                        <h3 style="margin: 0;">Upcoming Deadlines</h3>
                    </div>
                    <div class="card-body">
                        ${pendingHw.length > 0
                ? `
                            <ul class="deadline-list">
                                ${pendingHw
                    .slice(0, 5)
                    .map((hw) => {
                        const sub = subjects.find(
                            (s) => s.id === hw.subjectId,
                        ) || {
                            name: "General Task",
                            color: "var(--text-primary)",
                        };
                        return `
                                        <li class="deadline-item">
                                            <div class="deadline-info">
                                                <div class="deadline-title">${hw.title}</div>
                                                <div class="deadline-sub" style="color: ${sub.color}">${sub.name} &bull; Due: ${hw.dueDate}</div>
                                            </div>
                                            <span class="priority-badge priority-${hw.priority}">${hw.priority}</span>
                                        </li>
                                    `;
                    })
                    .join("")}
                            </ul>
                        `
                : '<div class="empty-state">All caught up! No pending tasks.</div>'
            }
                    </div>
                </div>
            </div>
        `;
    }
}
