# Local-First Academic Study Planner

A comprehensive, offline-first, high-performance web application designed to be the ultimate personal academic management system for college students. It combines the aesthetic minimalism of Notion, the functionality of Google Calendar, and the focused productivity of tools like Todoist, all contained entirely within your local browser.

## Features

This application strictly separates concerns into independent modules, offering a massive suite of features:

- **Weekly Timetable**: Interactive 5-day grid with drag-and-drop capability.
- **Subject Management**: Full CRUD operations for courses with automatic color-coding integration across the app.
- **Homework Tracker**: A Kanban board (Pending, In Progress, Completed, Missed) with priority badging and deadline tracking.
- **Attendance Analytics**: Automated calculations of attendance percentages, missing thresholds, and "safe to bunk" allowances.
- **Topics & Revision Timeline**: Track what was taught, your understanding levels, and flag items for revision.
- **Study Session Planner**: Built-in Pomodoro timer (25-min focus sessions) linked directly to subjects.
- **Unified Calendar System**: Monthly view that queries all databases to aggregate classes, deadlines, and study sessions.
- **Rich Note-taking**: Subject-linked, pinnable, searchable quick notes.
- **Exam Tracker**: Syllabus progression tracking and exam countdowns.
- **Global Search**: Instantly query across all your notes, homework, subjects, and exams simultaneously.
- **Interactive Analytics**: Beautiful CSS-only bar charts and donut charts visualizing your study habits.

## Architecture & Philosophy

- **Zero Dependencies**: No React, Vue, Angular, or backend servers. Built entirely with pure HTML5, CSS3, and Vanilla JavaScript.
- **Zero External Calls**: No network requests are made for data. (Icons rely on FontAwesome CDN).
- **Strictly Local Storage**: All data is persisted using the browser's native `IndexedDB` via a robust Promise-based wrapper (`modules/storage.js`).
- **Event-Driven UI**: Components communicate via custom DOM events (`appReady`) to keep the UI perfectly synchronized without spaghetti code.
- **Responsive Design**: The application uses advanced CSS Grid and Flexbox layouts. The grid gracefully degrades into vertically stacked "Agenda" modes and mobile-friendly sidebars on smaller screens.

## File Structure

The project employs a strictly modular design:

```plaintext
/project-root
│
├── index.html                # Single-Page App (SPA) entry point and layout
├── styles.css                # Core variables, base layout, sidebar, and typography
├── script.js                 # App orchestrator and module initializer
│
├── /modules                  # Business Logic & DOM bindings
│   ├── storage.js            # IndexedDB API wrapper
│   ├── navigation.js         # Sidebar and mobile menu routing
│   ├── dashboard.js          # Aggregated overview logic
│   ├── search.js             # Global database querying
│   ├── seeder.js             # Generates sample data on first boot
│   └── (timetable, subjects, homework, attendance, calendar, notes, exams, etc.)
│
└── /css-modules              # Component-Specific Styles
    ├── timetable.css
    ├── homework.css
    ├── analytics.css
    ├── onboarding.css
    └── (subjects, attendance, calendar, notes, exams, etc.)
```

## Usage

Because this application relies on zero build tools or servers:

1. Simply clone or download this repository.
2. Open `index.html` in any modern web browser.
3. Complete the beautiful onboarding flow to set up your profile.
4. Enjoy! Your data is automatically saved locally.

> **Note**: Do not use "Incognito" or "Private Browsing" modes, as browsers will aggressively wipe IndexedDB data when the session closes.

## Data Management

The **Settings** tab allows you to completely manage your lifecycle:

- Export your entire database to a `data.json` file for backup.
- "Clear All Data" safely purges your IndexedDB if you wish to reset your semester.
