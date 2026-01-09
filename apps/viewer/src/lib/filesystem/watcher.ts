/**
 * Directory watcher using polling
 * Used by Browser filesystem since File System Access API doesn't support watching
 */

import type { DirectoryChangeCallback, DirectoryChangeEvent, FileEntry } from './types.js';

/**
 * Simple hash function for change detection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Create a fingerprint of file tree for change detection
 * Only compares paths, not content (content changes detected on read)
 */
function createFingerprint(entry: FileEntry): string {
  const paths: string[] = [];

  function collect(e: FileEntry): void {
    paths.push(e.path);
    e.children?.forEach(collect);
  }

  collect(entry);
  return paths.sort().join('\n');
}

/**
 * Type for the directory reader function
 */
export type DirectoryReader = (path: string) => Promise<FileEntry | null>;

/**
 * Polls a directory for changes and notifies via callback
 */
export class DirectoryWatcher {
  private intervalId: number | null = null;
  private lastHash: number | null = null;
  private callback: DirectoryChangeCallback | null = null;
  private watchPath: string | null = null;

  constructor(
    private readonly reader: DirectoryReader,
    private readonly pollIntervalMs: number = 2000
  ) {}

  /**
   * Start watching a directory
   */
  async start(path: string, callback: DirectoryChangeCallback): Promise<void> {
    // Stop any existing watch
    this.stop();

    this.callback = callback;
    this.watchPath = path;

    // Take initial snapshot
    const tree = await this.reader(path);
    if (tree) {
      this.lastHash = hashString(createFingerprint(tree));
    }

    // Start polling
    this.intervalId = window.setInterval(() => this.poll(), this.pollIntervalMs);
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.lastHash = null;
    this.callback = null;
    this.watchPath = null;
  }

  /**
   * Check if currently watching
   */
  get isWatching(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Get the path being watched
   */
  get path(): string | null {
    return this.watchPath;
  }

  /**
   * Poll for changes (called by interval)
   */
  private async poll(): Promise<void> {
    if (!this.watchPath || !this.callback) return;

    try {
      const tree = await this.reader(this.watchPath);
      if (!tree) return;

      const fingerprint = createFingerprint(tree);
      const newHash = hashString(fingerprint);

      if (newHash !== this.lastHash) {
        this.lastHash = newHash;

        // We can't determine exact change type with polling
        const event: DirectoryChangeEvent = {
          type: 'unknown',
          path: this.watchPath,
        };

        this.callback(event);
      }
    } catch (error) {
      console.error('Directory poll error:', error);
    }
  }
}
