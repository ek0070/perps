type Entry<T> = { at: number; value?: T; pending?: Promise<T> };

const g = globalThis as unknown as { __ttCache?: Map<string, Entry<unknown>> };
const store = (g.__ttCache ??= new Map());

/**
 * Shared in-process cache: every visitor inside the ttl gets the same value and
 * concurrent callers share one upstream request. A failed refresh serves the
 * last good value instead of an error.
 */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  const now = Date.now();
  if (hit?.value !== undefined && now - hit.at < ttlMs) return hit.value;
  if (hit?.pending) return hit.pending;

  const entry: Entry<T> = hit ?? { at: 0 };
  entry.pending = load()
    .then((value) => {
      entry.value = value;
      entry.at = Date.now();
      return value;
    })
    .catch((err) => {
      if (entry.value !== undefined) return entry.value;
      throw err;
    })
    .finally(() => {
      entry.pending = undefined;
    });
  store.set(key, entry);
  if (store.size > 2000) store.delete(store.keys().next().value as string);
  return entry.pending;
}
