/**
 * Web stub for PowerSync — replaces lib/powersync.ts on web builds.
 * Metro resolves *.web.ts over *.ts automatically.
 * All methods are no-ops; data in the web preview is in-memory only.
 */

export const AppSchema = {};
export const connector = {};

export const powerSyncDb = {
  connect: async () => {},
  execute: async (_sql: string, _params?: unknown[]) => {},
  // Yields one empty batch then stops — web has no SQLite
  watch: async function* <T = unknown>(
    _sql: string,
    _params?: unknown[],
  ): AsyncGenerator<T[]> {
    yield [] as T[];
  },
  getNextCrudTransaction: async () => null,
};
