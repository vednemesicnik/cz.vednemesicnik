/**
 * One step at a time per key. Two clicks, two people, or a second request while the first is still
 * on Drive would otherwise each see the same thing missing and each create it. The app is one
 * process on one machine, so a lock in memory is the whole of it.
 */
export type Lock = {
  <T>(key: string, run: () => Promise<T>): Promise<T>
  /**
   * Runs only when nobody holds the key, and says whether it ran. For work on somebody else's key
   * that its holder will do anyway: waiting for it instead could wait on a request that is itself
   * waiting for ours.
   */
  ifFree(key: string, run: () => Promise<void>): Promise<boolean>
}

export function createLock(): Lock {
  let running = new Map<string, Promise<unknown>>()

  async function lock<T>(key: string, run: () => Promise<T>): Promise<T> {
    let previous = running.get(key) ?? Promise.resolve()
    let current = previous.then(run, run)
    let settled = current.catch(() => undefined)
    running.set(key, settled)
    try {
      return await current
    } finally {
      if (running.get(key) === settled) running.delete(key)
    }
  }

  return Object.assign(lock, {
    async ifFree(key: string, run: () => Promise<void>): Promise<boolean> {
      if (running.has(key)) return false
      await lock(key, run)
      return true
    },
  })
}
