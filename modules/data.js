import { StorageAPI } from './storage.js';
import { showConfirm, showModal, showAlert } from './modal.js';

export function initDataManagement() {
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-data-input');
    const clearBtn = document.getElementById('clear-data-btn');

    const stores = [
        'subjects', 'timetable', 'homework', 'attendance', 'topics',
        'study', 'events', 'notes', 'exams', 'settings'
    ];

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const result = await showModal('Export Data', [
                { id: 'filename', label: 'File Name', type: 'text', value: 'studyplanner_backup', required: true }
            ]);

            if (result?.filename) {
                const exportData = {};
                for (const store of stores) {
                    exportData[store] = await StorageAPI.getAll(store);
                }

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", result.filename.endsWith('.json') ? result.filename : result.filename + ".json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                await showAlert("Your data has been successfully exported.", "Export Complete", "success");
            }
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const confirmed = await showConfirm(
                "Importing data will overwrite your current data. Are you sure you want to proceed?",
                "Import Data",
                "warning"
            );

            if (!confirmed) {
                importInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Clear existing data first
                    for (const store of stores) {
                        await StorageAPI.clear(store);
                    }

                    // Restore imported data
                    for (const store of stores) {
                        if (importedData[store] && Array.isArray(importedData[store])) {
                            for (const item of importedData[store]) {
                                await StorageAPI.save(store, item);
                            }
                        }
                    }
                    
                    await showConfirm("Data has been successfully imported. The application will now reload.", "Import Complete", "success");
                    globalThis.location.reload();
                } catch (err) {
                    console.error("Error parsing JSON", err);
                    await showAlert("There was an error reading the backup file. Ensure it is a valid JSON file exported from StudyPlanner.", "Import Failed", "danger");
                }
                importInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm(
                "Are you absolutely sure you want to clear all data? This cannot be undone and will permanently delete all your subjects, homework, notes, and settings.",
                "Clear All Data",
                "danger"
            );

            if (confirmed) {
                for (const store of stores) {
                    await StorageAPI.clear(store);
                }

                // Clear localStorage just in case we used it for theme
                localStorage.removeItem('theme');

                await showConfirm("All data has been cleared. The application will now reload.", "Data Cleared", "info");
                globalThis.location.reload();
            }
        });
    }
}
