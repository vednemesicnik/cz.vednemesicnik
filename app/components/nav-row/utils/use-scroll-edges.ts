import { type RefObject, useEffect, useState } from 'react'

type ScrollEdges = {
  end: boolean
  start: boolean
}

const NO_EDGES: ScrollEdges = { end: false, start: false }

/**
 * Which ends of a sideways-scrolling element still hide content, kept up to
 * date as it scrolls and changes size. Both are `false` while everything fits,
 * and before hydration.
 *
 * @param ref - The scrolling element
 * @returns `start` while content waits before the visible part, `end` while
 *   it waits after it
 */
export const useScrollEdges = (
  ref: RefObject<HTMLElement | null>,
): ScrollEdges => {
  const [edges, setEdges] = useState(NO_EDGES)

  useEffect(() => {
    const element = ref.current

    if (element === null) return

    // A pixel of slack: zoomed layouts land on fractions.
    const update = () => {
      const maximum = element.scrollWidth - element.clientWidth
      const start = element.scrollLeft > 1
      const end = element.scrollLeft < maximum - 1

      setEdges((previous) =>
        previous.start === start && previous.end === end
          ? previous
          : { end, start },
      )
    }

    update()
    element.addEventListener('scroll', update, { passive: true })
    // The element fills the space it is given, so its own size misses items
    // that grow, e.g. when a web font arrives; the items are watched too.
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(element)
    for (const child of element.children) resizeObserver.observe(child)

    return () => {
      element.removeEventListener('scroll', update)
      resizeObserver.disconnect()
    }
  }, [ref])

  return edges
}
