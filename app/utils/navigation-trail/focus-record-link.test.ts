// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
  vi.restoreAllMocks()
})

const setUp = async (supportsFocusVisible: boolean) => {
  vi.doMock('~/utils/input-modality/supports-focus-visible-option', () => ({
    supportsFocusVisibleOption: () => supportsFocusVisible,
  }))
  document.body.innerHTML = '<a href="/articles/ples">Ples</a>'
  const link = document.querySelector('a') as HTMLAnchorElement
  const focus = vi.spyOn(link, 'focus')
  const { focusRecordLink } = await import('./focus-record-link')

  return { focus, focusRecordLink }
}

describe('focusRecordLink', () => {
  test('focuses the row after the keyboard, with its ring', async () => {
    const { focus, focusRecordLink } = await setUp(true)

    focusRecordLink('/articles/ples', 'keyboard')

    expect(focus.mock.lastCall).toEqual([{ preventScroll: true }])
  })

  test('focuses the row without a ring after a mouse or touch, where the browser can', async () => {
    const { focus, focusRecordLink } = await setUp(true)

    focusRecordLink('/articles/ples', 'pointer')

    expect(focus.mock.lastCall).toEqual([
      { focusVisible: false, preventScroll: true },
    ])
  })

  test('leaves the focus after a mouse or touch where the browser would draw the ring', async () => {
    const { focus, focusRecordLink } = await setUp(false)

    focusRecordLink('/articles/ples', 'pointer')

    expect(focus).not.toHaveBeenCalled()
  })

  test('does nothing for a row no longer in the list', async () => {
    const { focus, focusRecordLink } = await setUp(true)

    focusRecordLink('/articles/jiny', 'keyboard')

    expect(focus).not.toHaveBeenCalled()
  })
})
