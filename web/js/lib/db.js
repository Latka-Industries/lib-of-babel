// Tiny IndexedDB key/value store — the only thing persisted is the journey.

import { DB_NAME, STORE } from "./constants.js";
import { SEEN_ABOUT_KEY } from "../about/about.js";

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

/** Clear every key in the library store (journey + Babelgram handoffs). */
export async function kvClear() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Wipe local IndexedDB and hard-reload so a stale generator trail cannot linger.
 * Strips the hash so boot does not re-open a legacy permalink.
 */
export async function wipeLocalDataAndReload() {
  try {
    await kvClear();
  } catch (err) {
    console.error(err);
  }
  try {
    localStorage.removeItem(SEEN_ABOUT_KEY);
  } catch {
    /* ignore */
  }
  const path = `${location.pathname}${location.search}`;
  location.replace(path || "/");
}
