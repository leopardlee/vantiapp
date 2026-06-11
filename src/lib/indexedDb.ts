import { openDB } from 'idb';

const DB_NAME = 'VantiOfflineCache';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('mapTiles')) {
                db.createObjectStore('mapTiles', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('itineraryData')) {
                db.createObjectStore('itineraryData', { keyPath: 'id' });
            }
        },
    });
};

export const saveItem = async (storeName: 'mapTiles' | 'itineraryData', item: any) => {
    const db = await initDB();
    await db.put(storeName, item);
};

export const getItem = async (storeName: 'mapTiles' | 'itineraryData', id: string) => {
    const db = await initDB();
    return db.get(storeName, id);
};

export const getAllItems = async (storeName: 'mapTiles' | 'itineraryData') => {
    const db = await initDB();
    return db.getAll(storeName);
};
