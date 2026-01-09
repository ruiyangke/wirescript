/**
 * Storage adapters for filesystem persistence
 * Abstracts IndexedDB and localStorage for testability
 */

import type { HandleStorage } from './types.js';

/**
 * IndexedDB-based storage for FileSystemHandle objects
 * Handles are special objects that can only be stored in IndexedDB
 */
export class IndexedDBStorage implements HandleStorage {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly dbName: string = 'wirescript-fs',
    private readonly storeName: string = 'handles',
    private readonly version: number = 1
  ) {}

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.dbPromise = null;

        this.db.onclose = () => {
          this.db = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async set(key: string, value: unknown): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * localStorage-based storage for simple key-value data
 * Used by FallbackFileSystem for file content persistence
 */
export class LocalStorageAdapter implements HandleStorage {
  constructor(private readonly prefix: string = 'wirescript-') {}

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(this.key(key));
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(this.key(key), JSON.stringify(value));
    } catch (e) {
      // localStorage might be full or disabled
      console.error('Failed to save to localStorage:', e);
      throw e;
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.key(key));
  }
}

/**
 * In-memory storage for testing
 */
export class MemoryStorage implements HandleStorage {
  private data = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.data.get(key) as T) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}
