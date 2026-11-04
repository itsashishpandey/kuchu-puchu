// Runs work for the same key one at a time. "Check, then write" steps (has this viewer already
// counted? is there enough balance?) would otherwise let simultaneous requests all pass the check.
// The live app is a single Node process (PM2 fork mode), so an in-process queue is enough.
const tails = new Map<string, Promise<unknown>>();

export async function withLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const before = tails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>(r => { release = r; });
  const tail = before.then(() => mine);
  tails.set(key, tail);
  try {
    await before.catch(() => {});
    return await work();
  } finally {
    release();
    if (tails.get(key) === tail) tails.delete(key);
  }
}
