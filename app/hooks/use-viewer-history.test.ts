// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'

import { popStateGuard } from '~/utils/history/popstate-guard'

import { useViewerHistory } from './use-viewer-history'

// As in entry.client.tsx: before the router's listener.
beforeAll(() => {
  popStateGuard.install()
})

// jsdom's <dialog> has no modal behaviour; this one opens and fires `close`.
const createDialog = () => {
  const dialog = document.createElement('dialog')

  dialog.showModal = () => {
    dialog.open = true
  }
  dialog.close = () => {
    if (!dialog.open) return

    dialog.open = false
    dialog.dispatchEvent(new Event('close'))
  }

  document.body.append(dialog)

  return dialog
}

// A listener added after the guard's, standing in for React Router's.
const routerListener = vi.fn()

beforeEach(() => {
  window.history.replaceState({ idx: 3, key: 'article' }, '')
  window.addEventListener('popstate', routerListener)
})

afterEach(() => {
  cleanup()
  window.removeEventListener('popstate', routerListener)
  document.body.replaceChildren()
  vi.restoreAllMocks()
  routerListener.mockClear()
})

const renderViewerHistory = () => {
  const dialog = createDialog()
  const { result } = renderHook(() => useViewerHistory({ current: dialog }))

  return { dialog, open: result.current }
}

// Moves to the entry before the viewer's, as Back does, and fires `popstate`.
const pressBack = (state: unknown) => {
  window.history.replaceState(state, '')
  window.dispatchEvent(new PopStateEvent('popstate', { state }))
}

describe('useViewerHistory', () => {
  test('opening pushes one entry that keeps the router state', () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    const { dialog, open } = renderViewerHistory()

    open()

    expect(dialog.open).toBe(true)
    expect(pushState).toHaveBeenCalledTimes(1)
    expect(pushState).toHaveBeenCalledWith(
      { idx: 3, imageViewer: true, key: 'article' },
      '',
    )
  })

  test('opening an open viewer pushes nothing more', () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    const { open } = renderViewerHistory()

    open()
    open()

    expect(pushState).toHaveBeenCalledTimes(1)
  })

  test('Back closes the viewer, and the router never sees it', () => {
    const back = vi.spyOn(window.history, 'back')
    const { dialog, open } = renderViewerHistory()

    open()
    pressBack({ idx: 3, key: 'article' })

    expect(dialog.open).toBe(false)
    expect(back).not.toHaveBeenCalled()
    expect(routerListener).not.toHaveBeenCalled()
  })

  test('Back hands the close to onBack, with its popstate', () => {
    const dialog = createDialog()
    const onBack = vi.fn()
    const { result } = renderHook(() =>
      useViewerHistory({ current: dialog }, onBack),
    )

    result.current()
    pressBack({ idx: 3, key: 'article' })

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onBack.mock.lastCall?.[0]).toBeInstanceOf(PopStateEvent)
    expect(dialog.open).toBe(true)
    expect(routerListener).not.toHaveBeenCalled()
  })

  test('a close after onBack does not step back again', () => {
    const back = vi.spyOn(window.history, 'back')
    const dialog = createDialog()
    const { result } = renderHook(() =>
      useViewerHistory({ current: dialog }, () => dialog.close()),
    )

    result.current()
    pressBack({ idx: 3, key: 'article' })

    expect(dialog.open).toBe(false)
    expect(back).not.toHaveBeenCalled()
  })

  test('closing another way steps back over the entry, unseen by the router', () => {
    const back = vi
      .spyOn(window.history, 'back')
      .mockImplementation(() => pressBack({ idx: 3, key: 'article' }))
    const { dialog, open } = renderViewerHistory()

    open()
    dialog.close()

    expect(back).toHaveBeenCalledTimes(1)
    expect(routerListener).not.toHaveBeenCalled()
  })

  test('the next Back after a close reaches the router', () => {
    vi.spyOn(window.history, 'back').mockImplementation(() =>
      pressBack({ idx: 3, key: 'article' }),
    )
    const { dialog, open } = renderViewerHistory()

    open()
    dialog.close()
    pressBack({ idx: 2, key: 'list' })

    expect(routerListener).toHaveBeenCalledTimes(1)
  })

  test('Forward onto a closed viewer’s entry steps back over it', () => {
    const { dialog, open } = renderViewerHistory()

    open()
    pressBack({ idx: 3, key: 'article' })
    expect(dialog.open).toBe(false)

    const back = vi.spyOn(window.history, 'back')
    pressBack({ idx: 3, imageViewer: true, key: 'article' })

    expect(back).toHaveBeenCalledTimes(1)
    expect(routerListener).not.toHaveBeenCalled()
  })

  test('another page’s viewer entry goes to the router', () => {
    const back = vi.spyOn(window.history, 'back')
    const { open } = renderViewerHistory()

    open()
    pressBack({ idx: 3, key: 'article' })
    pressBack({ idx: 5, imageViewer: true, key: 'other-article' })

    expect(back).not.toHaveBeenCalled()
    expect(routerListener).toHaveBeenCalledTimes(1)
  })
})
