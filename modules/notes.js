import { StorageAPI } from './storage.js';
import { showConfirm } from './modal.js';

export async function initNotes() {
    const container = document.getElementById('notes-content');
    const addBtn = document.getElementById('add-note-btn');
    const searchInput = document.getElementById('notes-search');

    if (!container) return;

    let currentSearch = '';

    // Create Modal HTML and inject to DOM
    const modalHtml = `
        <div class="note-modal" id="note-editor-modal">
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3 style="margin:0;">Edit Note</h3>
                    <button class="icon-btn" id="close-note-modal"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="note-modal-body">
                    <select id="note-subject-select" class="form-select" style="width: fit-content; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary);">
                        <option value="">General Note</option>
                    </select>
                    <input type="text" id="note-title-input" class="note-input-title" placeholder="Note Title...">
                    <textarea id="note-content-input" class="note-textarea" placeholder="Write your notes here..."></textarea>
                </div>
                <div class="note-modal-footer">
                    <button class="btn" id="delete-note-btn" style="color: var(--danger); background: transparent; border: 1px solid var(--danger);">Delete Note</button>
                    <button class="btn btn-primary" id="save-note-btn">Save Note</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('note-editor-modal');
    const subjectSelect = document.getElementById('note-subject-select');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const saveBtn = document.getElementById('save-note-btn');
    const deleteBtn = document.getElementById('delete-note-btn');
    const closeBtn = document.getElementById('close-note-modal');

    let currentEditingId = null;
    let isPinned = false;

    document.addEventListener('appReady', render);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            render();
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openModal();
        });
    }

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    saveBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim() || 'Untitled Note';
        const content = contentInput.value.trim();
        const subjectId = subjectSelect.value;

        const note = {
            id: currentEditingId || 'note_' + Date.now(),
            title,
            content,
            subjectId,
            pinned: isPinned,
            updatedAt: new Date().toISOString()
        };

        await StorageAPI.save('notes', note);
        modal.classList.remove('active');
        render();
    });

    deleteBtn.addEventListener('click', async () => {
        if (currentEditingId) {
            const confirmed = await showConfirm("Are you sure you want to delete this note?", "Delete Note", "danger");
            if (confirmed) {
                await StorageAPI.delete('notes', currentEditingId);
                modal.classList.remove('active');
                render();
            }
        }
    });

    async function openModal(noteId = null) {
        currentEditingId = noteId;
        const subjects = await StorageAPI.getAll('subjects');

        subjectSelect.innerHTML = '<option value="">General Note</option>' +
            subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        if (noteId) {
            const note = await StorageAPI.get('notes', noteId);
            titleInput.value = note.title;
            contentInput.value = note.content;
            subjectSelect.value = note.subjectId || '';
            isPinned = note.pinned || false;
            deleteBtn.style.display = 'block';
        } else {
            titleInput.value = '';
            contentInput.value = '';
            subjectSelect.value = '';
            isPinned = false;
            deleteBtn.style.display = 'none';
        }

        modal.classList.add('active');
    }

    async function render() {
        const notes = await StorageAPI.getAll('notes');
        const subjects = await StorageAPI.getAll('subjects');

        // Filter by search
        let filteredNotes = notes;
        if (currentSearch) {
            filteredNotes = notes.filter(n =>
                n.title.toLowerCase().includes(currentSearch) ||
                n.content.toLowerCase().includes(currentSearch)
            );
        }

        // Sort: Pinned first, then by date descending
        filteredNotes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        if (filteredNotes.length === 0) {
            container.innerHTML = `<div class="empty-state">No notes found. Create your first note!</div>`;
            return;
        }

        let html = '<div class="notes-grid">';

        filteredNotes.forEach(note => {
            const sub = subjects.find(s => s.id === note.subjectId);
            const subName = sub ? sub.name : 'General Note';
            const subColor = sub ? sub.color : 'var(--text-secondary)';

            const dateStr = new Date(note.updatedAt).toLocaleDateString();

            // Sanitize preview slightly for HTML safety in list view
            const safeContent = note.content.replaceAll('<', "&lt;").replaceAll('>', "&gt;");

            html += `
                <div class="note-card ${note.pinned ? 'pinned' : ''}" data-id="${note.id}">
                    <div class="note-header">
                        <div class="note-title" title="${note.title.replaceAll('"', '&quot;')}">${note.title.replaceAll('<', "&lt;")}</div>
                        <i class="fa-solid fa-thumbtack note-pin ${note.pinned ? 'active' : ''}" data-id="${note.id}" title="${note.pinned ? 'Unpin Note' : 'Pin Note'}"></i>
                    </div>
                    <div class="note-subject" style="color: ${subColor}; border: 1px solid ${subColor}40; background-color: ${subColor}15;">${subName}</div>
                    <div class="note-preview">${safeContent || '<em>Empty note</em>'}</div>
                    <div class="note-footer">
                        <span><i class="fa-regular fa-clock"></i> Edited ${dateStr}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Card Click -> Edit
        container.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent opening modal if clicking the pin icon
                if (e.target.classList.contains('fa-thumbtack')) return;
                openModal(card.dataset.id);
            });
        });

        // Pin Toggle
        container.querySelectorAll('.note-pin').forEach(pin => {
            pin.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                const note = await StorageAPI.get('notes', id);
                if (note) {
                    note.pinned = !note.pinned;
                    await StorageAPI.save('notes', note);
                    render();
                }
            });
        });
    }
}
