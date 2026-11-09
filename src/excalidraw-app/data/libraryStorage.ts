import { createStore, del, get, set } from "idb-keyval";
import { LibraryItems } from "../../types";
import { STORAGE_KEYS } from "../app_constants";

const libraryStore = createStore("excalidraw-library-db", "libraries");
const LIBRARY_STORAGE_KEY = STORAGE_KEYS.LOCAL_STORAGE_LIBRARY;
const LIBRARY_SIZE_STORAGE_KEY = STORAGE_KEYS.LOCAL_STORAGE_LIBRARY_SIZE;
const LOCAL_STORAGE_LIMIT = 1_500_000;

const saveLibrarySize = (size: number) => {
  try {
    localStorage.setItem(LIBRARY_SIZE_STORAGE_KEY, String(size));
  } catch {
    // Size is only diagnostic; library persistence takes priority.
  }
};

export const loadLibraryItemsFromStorage = async (): Promise<LibraryItems> => {
  try {
    const indexedDbItems = (await get(LIBRARY_STORAGE_KEY, libraryStore)) as
      | LibraryItems
      | undefined;
    if (indexedDbItems) {
      return indexedDbItems;
    }
  } catch (error) {
    console.error("Unable to load library items from IndexedDB", error);
  }

  try {
    const localItems = localStorage.getItem(LIBRARY_STORAGE_KEY);
    return localItems ? (JSON.parse(localItems) as LibraryItems) : [];
  } catch (error) {
    console.error("Unable to load library items from localStorage", error);
    return [];
  }
};

const removeLegacyLocalStorageItem = () => {
  try {
    localStorage.removeItem(LIBRARY_STORAGE_KEY);
  } catch {
    // IndexedDB is the source of truth when the browser blocks localStorage.
  }
};

const removeLibrarySize = () => {
  try {
    localStorage.removeItem(LIBRARY_SIZE_STORAGE_KEY);
  } catch {
    // Ignore unavailable localStorage.
  }
};

export const saveLibraryItemsToStorage = async (items: LibraryItems) => {
  if (!items.length) {
    removeLegacyLocalStorageItem();
    removeLibrarySize();
    await del(LIBRARY_STORAGE_KEY, libraryStore);
    return;
  }

  const serializedItems = JSON.stringify(items);
  if (serializedItems.length > LOCAL_STORAGE_LIMIT) {
    await set(LIBRARY_STORAGE_KEY, items, libraryStore);
    removeLegacyLocalStorageItem();
    saveLibrarySize(serializedItems.length);
    return;
  }

  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, serializedItems);
    try {
      await del(LIBRARY_STORAGE_KEY, libraryStore);
    } catch {
      // Keep both stores in sync; IndexedDB takes precedence when loading.
      await set(LIBRARY_STORAGE_KEY, items, libraryStore);
    }
  } catch (error) {
    // Fall back to IndexedDB if browser quota is already close to its limit.
    await set(LIBRARY_STORAGE_KEY, items, libraryStore);
    removeLegacyLocalStorageItem();
  }
  saveLibrarySize(serializedItems.length);
};
