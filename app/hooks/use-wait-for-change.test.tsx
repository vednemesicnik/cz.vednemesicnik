// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useWaitForChange } from './use-wait-for-change'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const renderWait = (initialValue: string) =>
  renderHook(({ value }) => useWaitForChange(value), {
    initialProps: { value: initialValue },
  })

const track = (promise: Promise<void>) => {
  const state = { isSettled: false }
  void promise.then(() => {
    state.isSettled = true
  })
  return state
}

describe('useWaitForChange', () => {
  test('settles at once when the value has changed already', async () => {
    const { result, rerender } = renderWait('old')
    rerender({ value: 'new' })

    const wait = track(result.current('old'))
    await act(async () => {})

    expect(wait.isSettled).toBe(true)
  })

  test('waits until a render shows another value', async () => {
    const { result, rerender } = renderWait('old')

    const wait = track(result.current('old'))
    await act(async () => {})
    expect(wait.isSettled).toBe(false)

    await act(async () => rerender({ value: 'new' }))
    expect(wait.isSettled).toBe(true)
  })

  test('settles after a second when the value stays', async () => {
    const { result, rerender } = renderWait('same')

    const wait = track(result.current('same'))
    await act(async () => rerender({ value: 'same' }))
    await act(async () => vi.advanceTimersByTime(999))
    expect(wait.isSettled).toBe(false)

    await act(async () => vi.advanceTimersByTime(1))
    expect(wait.isSettled).toBe(true)
  })
})
