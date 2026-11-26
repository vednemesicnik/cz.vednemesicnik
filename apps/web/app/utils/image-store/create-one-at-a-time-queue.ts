/** Runs jobs in the order they arrive, each only after the one before settled. */
export type OneAtATimeQueue = {
  run: <Result>(job: () => Promise<Result>) => Promise<Result>
}

/**
 * A queue that runs one job at a time. A failed job does not stop the ones
 * after it; its caller gets the rejection.
 *
 * @returns The queue.
 */
export function createOneAtATimeQueue(): OneAtATimeQueue {
  let last: Promise<unknown> = Promise.resolve()

  return {
    run: (job) => {
      const next = last.then(job, job)
      last = next.catch(() => {})
      return next
    },
  }
}
