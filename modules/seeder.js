import { StorageAPI } from './storage.js';

export async function seedInitialData() {
    const subjects = await StorageAPI.getAll('subjects');
    if (subjects.length === 0) {
        try {
            const response = await fetch('./data/data.json');
            if (response.ok) {
                const data = await response.json();
                
                for (const sub of data.subjects || []) {
                    await StorageAPI.save('subjects', sub);
                }
                for (const hw of data.homework || []) {
                    await StorageAPI.save('homework', hw);
                }
                console.log('Sample data seeded successfully.');
            }
        } catch (e) {
            console.warn('Failed to seed data. It might be due to CORS if opening directly as file:// or file missing.', e);
        }
    }
}
