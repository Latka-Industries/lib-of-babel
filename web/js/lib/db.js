// Tiny IndexedDB key/value store — the only thing persisted is the journey.

import { DB_NAME, STORE } from "./constants.js";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function kvGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    tx.onsuccess = () => resolve(tx.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function kvSet(key, val) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .put(val, key);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function kvDel(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(key);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
