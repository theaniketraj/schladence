import { StorageAPI } from './modules/storage.js';
import { initNavigation } from './modules/navigation.js';
import { initTheme } from './modules/theme.js';
import { seedInitialData } from './modules/seeder.js';
import { initOnboarding } from './modules/onboarding.js';
import { initSearch } from './modules/search.js';
import { initNotifications } from './modules/notifications.js';
import { initDataManagement } from './modules/data.js';
import { initDashboard } from './modules/dashboard.js';
import { initSubjects } from './modules/subjects.js';
import { initTimetable } from './modules/timetable.js';
import { initHomework } from './modules/homework.js';
import { initAttendance } from './modules/attendance.js';
import { initTopics } from './modules/topics.js';
import { initStudy } from './modules/study.js';
import { initAnalytics } from './modules/analytics.js';
import { initCalendar } from './modules/calendar.js';
import { initNotes } from './modules/notes.js';
import { initExams } from './modules/exams.js';
import { Gamification } from './modules/gamification.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }).catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // 1. Initialize Storage
    const storageReady = await StorageAPI.init();
    if (!storageReady) {
        console.error("Storage could not be initialized.");
    }

    // Seed sample data if DB is empty
    await seedInitialData();

    // 2. Initialize UI Components
    initTheme();
    initNavigation();
    initOnboarding();
    initSearch();
    initNotifications();
    initDataManagement();

    // 3. Initialize Modules
    initDashboard();
    initSubjects();
    initTimetable();
    initHomework();
    initAttendance();
    initTopics();
    initStudy();
    initAnalytics();
    initCalendar();
    initNotes();
    initExams();
    
    await Gamification.init();

    // Custom event to signal app is ready
    document.dispatchEvent(new CustomEvent('appReady'));
});
