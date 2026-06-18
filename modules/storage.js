const DB_NAME = 'StudyPlannerDB';
const DB_VERSION = 1;

export const StorageAPI = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.warn('IndexedDB failed, falling back to localStorage (Not fully implemented here)');
                resolve(false);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('subjects')) {
                    db.createObjectStore('subjects', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('timetable')) {
                    db.createObjectStore('timetable', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('homework')) {
                    db.createObjectStore('homework', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('attendance')) {
                    db.createObjectStore('attendance', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('topics')) {
                    db.createObjectStore('topics', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('study')) {
                    db.createObjectStore('study', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('events')) {
                    db.createObjectStore('events', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('notes')) {
                    db.createObjectStore('notes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('exams')) {
                    db.createObjectStore('exams', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    },

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve([]);
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(null);
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async save(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(false);
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(false);
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(false);
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
};
