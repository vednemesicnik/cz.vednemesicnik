// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'

import { runViewerTransition } from './run-viewer-transition'

const skipTransition = vi.fn()
let finish = () => {}

// A stand-in for the browser: it records the options, runs the update and
// finishes when the test says so.
const startViewTransition = vi.fn(
  (options: { update: () => void | Promise<void> }) => {
    void options.update()

    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })

    return { finished, ready: Promise.resolve(), skipTransition }
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
  finish()
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

  test('a pointer or key going down during the flight skips it', () => {
    stubBrowser({ hasTypes: true })

    runViewerTransition({ kind: 'open', update: () => {} })
    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))

    expect(skipTransition).toHaveBeenCalledTimes(2)
  })

  test('the click that skipped the flight goes on to the button under it', () => {
    stubBrowser({ hasTypes: true })
    const button = document.createElement('button')
    const handleClick = vi.fn()
    button.addEventListener('click', handleClick)
    document.body.append(button)
    // jsdom has no layout: the button is what lies under the pointer.
    Object.assign(document, { elementFromPoint: () => button })

    runViewerTransition({ kind: 'open', update: () => {} })
    window.dispatchEvent(new Event('pointerdown'))
    document.documentElement.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )

    expect(handleClick).toHaveBeenCalledTimes(1)

    Reflect.deleteProperty(document, 'elementFromPoint')
    button.remove()
  })

  test('once the flight has finished, input skips nothing', async () => {
    stubBrowser({ hasTypes: true })

    runViewerTransition({ kind: 'open', update: () => {} })
    finish()
    await new Promise((resolve) => setTimeout(resolve, 0))
    window.dispatchEvent(new Event('pointerdown'))

    expect(skipTransition).not.toHaveBeenCalled()
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
