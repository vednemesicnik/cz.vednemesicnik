// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
})

const load = async () =>
  (await import('./supports-focus-visible-option')).supportsFocusVisibleOption

describe('supportsFocusVisibleOption', () => {
  test('is true where focus() reads the focusVisible option', async () => {
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(
      (options?: FocusOptions) => {
        void options?.focusVisible
      },
    )

    expect((await load())()).toBe(true)
  })

  test('is false where focus() ignores it', async () => {
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {})

    expect((await load())()).toBe(false)
  })

  test('focuses nothing while it looks', async () => {
    const before = document.activeElement

    ;(await load())()

    expect(document.activeElement).toBe(before)
  })
})
