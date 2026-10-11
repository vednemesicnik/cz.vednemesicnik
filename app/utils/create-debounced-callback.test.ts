import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createDebouncedCallback } from '~/utils/create-debounced-callback'

describe('createDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should call the callback once the delay has passed', () => {
    const callback = vi.fn()
    const debounced = createDebouncedCallback(callback, 300)

    debounced.run()
    vi.advanceTimersByTime(299)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledOnce()
  })

  test('should restart the delay on every run', () => {
    const callback = vi.fn()
    const debounced = createDebouncedCallback(callback, 300)

    debounced.run()
    vi.advanceTimersByTime(200)
    debounced.run()
    vi.advanceTimersByTime(200)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(callback).toHaveBeenCalledOnce()
  })

  test('should drop a pending call on cancel', () => {
    const callback = vi.fn()
    const debounced = createDebouncedCallback(callback, 300)

    debounced.run()
    debounced.cancel()
    vi.advanceTimersByTime(300)

    expect(callback).not.toHaveBeenCalled()
  })

  test('should run again after a call has fired', () => {
    const callback = vi.fn()
    const debounced = createDebouncedCallback(callback, 300)

    debounced.run()
    vi.advanceTimersByTime(300)
    debounced.run()
    vi.advanceTimersByTime(300)

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
