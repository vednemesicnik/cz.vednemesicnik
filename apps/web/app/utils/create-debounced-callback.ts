type DebouncedCallback = {
  run: () => void
  cancel: () => void
}

/**
 * Creates a debounced callback: `run` (re)starts the timer, so the callback
 * fires once, `delay` milliseconds after the last `run`; `cancel` drops a
 * pending call.
 *
 * @param callback - Called when the timer runs out.
 * @param delay - The quiet period in milliseconds.
 * @returns `run` and `cancel`.
 */
export const createDebouncedCallback = (
  callback: () => void,
  delay: number,
): DebouncedCallback => {
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const run = () => {
    cancel()
    timer = setTimeout(() => {
      timer = undefined
      callback()
    }, delay)
  }

  return { cancel, run }
}
