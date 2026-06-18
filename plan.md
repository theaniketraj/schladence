# B. Design

B1. **Micro-interactions & Polish:** Add satisfying visual feedback for user actions. For example:

- A subtle confetti pop animation when a difficult homework assignment is marked as completed.
- Skeleton loaders (shimmering placeholders) in the dashboard instead of snapping elements into place immediately.
- Smooth, sliding page transitions when navigating through the sidebar instead of instant cuts.

B2. **Dynamic Color Theming:** While you have light and dark modes, allow users to choose their primary "accent color" (currently blue `#3b82f6`). Providing color presets (Emerald, Rose, Violet, Amber) lets students personalize their workspace.

## C. Interactivity

C1. **Drag-and-Drop Functionality:**

- **Timetable:** Allow users to drag a subject block to a different day/time slot directly.

C2. **Power-User Keyboard Shortcuts:** College students work fast. Implement global keyboard listeners for navigation and quick actions:

- `Ctrl/Cmd + K`: Jump to global search.
- `Ctrl/Cmd + N`: Open the universal "Add New" modal (letting them pick between adding a task, note, or exam).
- `Ctrl/Cmd + B`: Toggle the sidebar.
