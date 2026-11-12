// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
  vi.restoreAllMocks()
})

const setUp = async (supportsFocusVisible: boolean) => {
  vi.doMock('./supports-focus-visible-option', () => ({
    supportsFocusVisibleOption: () => supportsFocusVisible,
  }))
  document.body.innerHTML = '<a href="/articles/ples">Ples</a>'
  const link = document.querySelector('a') as HTMLAnchorElement
  const focus = vi.spyOn(link, 'focus')
  const { focusAfterInput } = await import('./focus-after-input')

  return { focus, focusAfterInput, link }
}

describe('focusAfterInput', () => {
  test('focuses after the keyboard, with its ring', async () => {
    const { focus, focusAfterInput, link } = await setUp(true)

    focusAfterInput(link, 'keyboard')

    expect(focus.mock.lastCall).toEqual([{ preventScroll: true }])
  })

  test('focuses without a ring after a mouse or touch, where the browser can', async () => {
    const { focus, focusAfterInput, link } = await setUp(true)

    focusAfterInput(link, 'pointer')

    expect(focus.mock.lastCall).toEqual([
      { focusVisible: false, preventScroll: true },
    ])
  })

  test('leaves the focus after a mouse or touch where the browser would draw the ring', async () => {
    const { focus, focusAfterInput, link } = await setUp(false)

    focusAfterInput(link, 'pointer')

    expect(focus).not.toHaveBeenCalled()
  })

  test('takes an unknown input as the keyboard', async () => {
    const { focus, focusAfterInput, link } = await setUp(false)

    focusAfterInput(link, null)

    expect(focus.mock.lastCall).toEqual([{ preventScroll: true }])
  })
})
