// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest'

import { skipViewTransition } from './skip-view-transition'

// jsdom has no Web Animations, so the test gives it a KeyframeEffect and the
// animations `getAnimations` would list.
class StubKeyframeEffect {
  constructor(readonly pseudoElement: string | null) {}
}

const stubAnimation = (pseudoElement: string | null) => ({
  effect: new StubKeyframeEffect(pseudoElement),
  finish: vi.fn(),
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document.documentElement, 'getAnimations')
  Reflect.deleteProperty(document, 'activeViewTransition')
})

describe('skipViewTransition', () => {
  test("skips the document's active transition where the browser has it", () => {
    const skipTransition = vi.fn()

    Object.assign(document, { activeViewTransition: { skipTransition } })

    skipViewTransition()

    expect(skipTransition).toHaveBeenCalledOnce()
  })

  test('finishes the animations of the view transition and nothing else', () => {
    const group = stubAnimation('::view-transition-group(article-image-a1)')
    const old = stubAnimation('::view-transition-old(root)')
    const element = stubAnimation(null)
    const other = stubAnimation('::after')

    vi.stubGlobal('KeyframeEffect', StubKeyframeEffect)
    Object.assign(document.documentElement, {
      getAnimations: () => [group, old, element, other],
    })

    skipViewTransition()

    expect(group.finish).toHaveBeenCalledOnce()
    expect(old.finish).toHaveBeenCalledOnce()
    expect(element.finish).not.toHaveBeenCalled()
    expect(other.finish).not.toHaveBeenCalled()
  })
})
