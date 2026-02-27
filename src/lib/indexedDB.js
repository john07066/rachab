import { openDB } from 'idb';

const DB_NAME = 'attendance_offline_db';
const STORE_NAME = 'pending_attendance';

export async function initDB() {
    return await openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Create store with auto-increment key
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                // Create indices to help query later if needed
                store.createIndex('session_id', 'session_id');
            }
        },
    });
}

export async function saveOfflineAttendance(record) {
    const db = await initDB();
    return await db.add(STORE_NAME, {
        ...record,
        timestamp: new Date().toISOString()
    });
}

export async function getPendingAttendance() {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
}

export async function removePendingAttendance(id) {
    const db = await initDB();
    return await db.delete(STORE_NAME, id);
}

export async function clearPendingAttendance() {
    const db = await initDB();
    return await db.clear(STORE_NAME);
}
