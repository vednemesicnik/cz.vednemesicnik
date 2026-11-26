// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { pageFlightStore } from './page-flight-store'
import { startPageFlight } from './start-page-flight'

const source = 'http://localhost/resources/article-image/a1-192.jpg'

// A row link with its framed, loaded image, as `ContentLinkImage` renders it.
const renderRow = ({ isLoaded = true } = {}) => {
  document.body.innerHTML = `
    <header data-app-header></header>
    <a href="/articles/a1">
      <div data-page-flight="article-image-a1" data-page-flight-kind="article-row">
        <picture><img alt=""></picture>
      </div>
      <h3>Title</h3>
    </a>`

  const image = document.querySelector('img') as HTMLImageElement

  Object.defineProperties(image, {
    complete: { value: isLoaded },
    currentSrc: { value: source },
    naturalWidth: { value: isLoaded ? 192 : 0 },
  })

  return image
}

const placeImage = (image: Element, top: number) => {
  image.getBoundingClientRect = () =>
    ({ bottom: top + 108, height: 108, top }) as DOMRect
}

const placeHeader = (bottom: number) => {
  const header = document.querySelector('[data-app-header]') as Element

  header.getBoundingClientRect = () => ({ bottom }) as DOMRect
}

const clickTitle = (init: MouseEventInit = {}) => {
  const title = document.querySelector('h3') as Element

  title.dispatchEvent(
    new MouseEvent('click', { bubbles: true, button: 0, ...init }),
  )
}

const stubReducedMotion = (matches: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches }))
}

beforeEach(() => {
  Object.assign(document, { startViewTransition: vi.fn() })
  stubReducedMotion(false)
  vi.stubGlobal('innerHeight', 800)
  document.addEventListener('click', startPageFlight)
})

afterEach(() => {
  document.removeEventListener('click', startPageFlight)
  pageFlightStore.clear()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'startViewTransition')
  document.body.innerHTML = ''
})

describe('startPageFlight', () => {
  test('starts the flight of a loaded, visible image', () => {
    const image = renderRow()
    placeImage(image, 300)
    placeHeader(64)

    clickTitle()

    expect(pageFlightStore.read()).toEqual({
      kind: 'article-row',
      name: 'article-image-a1',
      source,
    })
    expect(document.querySelector('[data-page-flight-flying]')).not.toBeNull()
  })

  test('reads the mark on the link itself', () => {
    const image = renderRow()
    const link = document.querySelector('a') as HTMLAnchorElement
    const frame = document.querySelector('[data-page-flight]') as HTMLElement

    link.dataset.pageFlight = 'podcast-cover-p1'
    link.dataset.pageFlightKind = 'tile'
    frame.removeAttribute('data-page-flight')
    placeImage(image, 300)
    placeHeader(64)

    clickTitle()

    expect(pageFlightStore.read()?.name).toBe('podcast-cover-p1')
  })

  test('lets nothing fly with reduced motion', () => {
    const image = renderRow()
    placeImage(image, 300)
    placeHeader(64)
    stubReducedMotion(true)

    clickTitle()

    expect(pageFlightStore.read()).toBeNull()
  })

  test('lets nothing fly while the image is still loading', () => {
    const image = renderRow({ isLoaded: false })
    placeImage(image, 300)
    placeHeader(64)

    clickTitle()

    expect(pageFlightStore.read()).toBeNull()
  })

  test('lets nothing fly when most of the image is under the header', () => {
    const image = renderRow()
    placeImage(image, 0)
    placeHeader(64)

    clickTitle()

    expect(pageFlightStore.read()).toBeNull()
  })

  test('lets nothing fly without view transitions', () => {
    const image = renderRow()
    placeImage(image, 300)
    placeHeader(64)
    Reflect.deleteProperty(document, 'startViewTransition')

    clickTitle()

    expect(pageFlightStore.read()).toBeNull()
  })

  test('lets nothing fly for a click that opens a new tab', () => {
    const image = renderRow()
    placeImage(image, 300)
    placeHeader(64)

    clickTitle({ metaKey: true })

    expect(pageFlightStore.read()).toBeNull()
  })
})
