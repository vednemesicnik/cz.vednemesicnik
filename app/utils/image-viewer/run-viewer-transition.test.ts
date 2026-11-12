// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'

import { runViewerTransition } from './run-viewer-transition'

// A stand-in for the browser: it records the options and runs the update.
const startViewTransition = vi.fn(
  (options: { update: () => void | Promise<void> }) => {
    void options.update()

    return { ready: Promise.resolve() }
  },
)

// `ViewTransition` as the feature check sees it: a prototype with `types`
// where the browser has them.
const stubBrowser = ({ hasTypes }: { hasTypes: boolean }) => {
  vi.stubGlobal('ViewTransition', {
    prototype: hasTypes ? { types: undefined } : {},
  })
  Object.assign(document, { startViewTransition })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  Reflect.deleteProperty(document, 'startViewTransition')
})

describe('runViewerTransition', () => {
  test('starts a transition typed by the viewer and the kind', () => {
    stubBrowser({ hasTypes: true })
    const update = vi.fn()

    runViewerTransition({ kind: 'close', update })

    expect(startViewTransition).toHaveBeenCalledWith({
      types: ['gallery-viewer', 'close'],
      update,
    })
    expect(update).toHaveBeenCalledTimes(1)
  })

  test('without types the update runs at once', () => {
    stubBrowser({ hasTypes: false })
    const update = vi.fn()

    runViewerTransition({ kind: 'open', update })

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
  })

  test('without the API the update runs at once', () => {
    const update = vi.fn()

    runViewerTransition({ kind: 'open', update })

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
  })
})
