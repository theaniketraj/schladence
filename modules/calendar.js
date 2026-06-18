import { StorageAPI } from './storage.js';
import { showModal } from './modal.js';

export async function initCalendar() {
    const container = document.getElementById('calendar-content');
    const addBtn = document.getElementById('add-calendar-event-btn');
    if (!container) return;

    let currentDate = new Date(); // Tracks the currently displayed month
    
    document.addEventListener('appReady', render);

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
            
            const result = await showModal('Add Calendar Event', [
                { id: 'title', label: 'Event Title', type: 'text', placeholder: 'E.g. College Fest', required: true },
                { id: 'date', label: 'Date', type: 'date', value: todayStr, required: true }
            ]);

            if (!result) return;
            
            const event = {
                id: 'evt_' + Date.now(),
                title: result.title,
                date: result.date,
                type: 'event'
            };
            
            await StorageAPI.save('events', event);
            render();
            document.dispatchEvent(new CustomEvent('appReady'));
        });
    }

    async function render() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Fetch data
        const events = await StorageAPI.getAll('events');
        const homework = await StorageAPI.getAll('homework');
        const study = await StorageAPI.getAll('study');
        const timetable = await StorageAPI.getAll('timetable');
        const subjects = await StorageAPI.getAll('subjects');

        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <h2 class="calendar-title">${monthNames[month]} ${year}</h2>
                    <div class="calendar-nav">
                        <button class="icon-btn" id="cal-prev"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="btn" id="cal-today" style="background: var(--bg-primary); border: 1px solid var(--border-color);">Today</button>
                        <button class="icon-btn" id="cal-next"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="calendar-grid">
                    ${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
        `;

        const totalCells = 42; // 6 rows of 7
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let i = 0; i < totalCells; i++) {
            let dayNum;
            let cellDate;
            let isOtherMonth = false;

            if (i < firstDay) {
                // Prev month
                dayNum = prevMonthDays - firstDay + i + 1;
                cellDate = new Date(year, month - 1, dayNum);
                isOtherMonth = true;
            } else if (i >= firstDay && i < firstDay + daysInMonth) {
                // Current month
                dayNum = i - firstDay + 1;
                cellDate = new Date(year, month, dayNum);
            } else {
                // Next month
                dayNum = i - firstDay - daysInMonth + 1;
                cellDate = new Date(year, month + 1, dayNum);
                isOtherMonth = true;
            }

            const isToday = isCurrentMonth && !isOtherMonth && dayNum === today.getDate();
            const dateString = `${cellDate.getFullYear()}-${String(cellDate.getMonth()+1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
            const weekdayName = fullDayNames[cellDate.getDay()];

            // Aggregate events
            const dayEvents = [];

            // 1. Classes
            const todaysClasses = timetable.filter(t => t.day === weekdayName);
            todaysClasses.sort((a,b) => a.period - b.period).forEach(c => {
                const sub = subjects.find(s => s.id === c.subjectId);
                dayEvents.push({ type: 'class', title: `${sub ? sub.code || sub.name.substring(0,3) : 'Class'} (P${c.period})` });
            });

            // 2. Homework Deadlines
            homework.filter(hw => hw.dueDate === dateString).forEach(hw => {
                dayEvents.push({ type: 'homework', title: `Due: ${hw.title}` });
            });

            // 3. Study Sessions
            study.filter(s => s.date === dateString).forEach(s => {
                dayEvents.push({ type: 'study', title: `Study: ${s.topic}` });
            });

            // 4. Custom Events
            events.filter(e => e.date === dateString).forEach(e => {
                dayEvents.push({ type: 'event', title: e.title });
            });

            const hasEvents = dayEvents.length > 0;
            const weekdayShort = dayNames[cellDate.getDay()];

            html += `
                <div class="calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : 'no-events'}" data-date="${dateString}" data-weekday="${weekdayShort}">
                    <div class="date-num">${dayNum}</div>
                    ${dayEvents.map(evt => `<div class="cal-event type-${evt.type}" title="${evt.title}">${evt.title}</div>`).join('')}
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Bindings
        container.querySelector('#cal-prev').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            render();
        });
        
        container.querySelector('#cal-next').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            render();
        });

        container.querySelector('#cal-today').addEventListener('click', () => {
            currentDate = new Date();
            render();
        });

        container.querySelectorAll('.calendar-cell').forEach(cell => {
            cell.addEventListener('dblclick', async (e) => {
                const date = e.currentTarget.dataset.date;
                const result = await showModal(`Add Event for ${date}`, [
                    { id: 'title', label: 'Event Title', type: 'text', placeholder: 'E.g. Doctor Appointment', required: true }
                ]);
                
                if (result) {
                    const event = {
                        id: 'evt_' + Date.now(),
                        title: result.title,
                        date,
                        type: 'event'
                    };
                    await StorageAPI.save('events', event);
                    render();
                    document.dispatchEvent(new CustomEvent('appReady'));
                }
            });
        });
    }
}
