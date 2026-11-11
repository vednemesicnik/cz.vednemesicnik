// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { runViewerTransition } from './run-viewer-transition'

type Pending = {
  callback: () => Promise<void> | void
  finish: () => void
}

let pending: Array<Pending> = []
let isMotionReduced = false

// A stand-in for the browser: the update runs only when the test says so,
// and `finished` settles after it.
const startViewTransition = (callback: () => Promise<void> | void) => {
  let finish = () => {}
  const finished = new Promise<void>((resolve) => {
    finish = resolve
  })
  pending.push({ callback, finish })

  return { finished, ready: Promise.resolve() }
}

const runNext = async () => {
  const next = pending.shift()

  if (next === undefined) return

  await next.callback()
  next.finish()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const createPhoto = () => {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

const nameOf = (element: HTMLElement) =>
  element.style.getPropertyValue('view-transition-name')

beforeEach(() => {
  pending = []
  isMotionReduced = false
  vi.stubGlobal('matchMedia', () => ({ matches: isMotionReduced }))
  Object.assign(document, { startViewTransition })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'startViewTransition')
  document.body.replaceChildren()
  delete document.documentElement.dataset.viewerTransition
})

describe('runViewerTransition', () => {
  test('the name moves from the photo before to the photo after', async () => {
    const tile = createPhoto()
    const frame = createPhoto()
    const update = vi.fn(() => {
      expect(nameOf(tile)).toBe('')
    })

    runViewerTransition({
      from: tile,
      getTo: () => frame,
      kind: 'open',
      update,
    })

    expect(nameOf(tile)).toBe('gallery-photo')
    expect(document.documentElement.dataset.viewerTransition).toBe('open')

    const next = pending[0]
    await next?.callback()

    expect(update).toHaveBeenCalledTimes(1)
    expect(nameOf(frame)).toBe('gallery-photo')
  })

  test('both names and the attribute go once it has finished', async () => {
    const tile = createPhoto()
    const frame = createPhoto()

    runViewerTransition({
      from: frame,
      getTo: () => tile,
      kind: 'close',
      update: () => {},
    })
    await runNext()

    expect(nameOf(frame)).toBe('')
    expect(nameOf(tile)).toBe('')
    expect(document.documentElement.dataset.viewerTransition).toBeUndefined()
  })

  test('a newer run keeps its names when the older one ends', async () => {
    const tile = createPhoto()
    const frame = createPhoto()

    runViewerTransition({
      from: tile,
      getTo: () => frame,
      kind: 'open',
      update: () => {},
    })
    runViewerTransition({
      from: frame,
      getTo: () => tile,
      kind: 'close',
      update: () => {},
    })

    expect(nameOf(tile)).toBe('')
    expect(nameOf(frame)).toBe('gallery-photo')

    // The skipped open still runs its update, and must not touch the names.
    await runNext()

    expect(nameOf(frame)).toBe('gallery-photo')
    expect(document.documentElement.dataset.viewerTransition).toBe('close')
  })

  test('with reduced motion nothing is named', async () => {
    isMotionReduced = true
    const tile = createPhoto()
    const frame = createPhoto()

    runViewerTransition({
      from: tile,
      getTo: () => frame,
      kind: 'open',
      update: () => {},
    })
    const next = pending[0]
    await next?.callback()

    expect(nameOf(tile)).toBe('')
    expect(nameOf(frame)).toBe('')
    expect(document.documentElement.dataset.viewerTransition).toBe('open')
  })

  test('without the API the update runs at once', () => {
    Reflect.deleteProperty(document, 'startViewTransition')
    const update = vi.fn()

    runViewerTransition({ from: null, getTo: () => null, kind: 'open', update })

    expect(update).toHaveBeenCalledTimes(1)
    expect(document.documentElement.dataset.viewerTransition).toBeUndefined()
  })
})
