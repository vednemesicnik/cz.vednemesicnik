import { useLayoutEffect, useRef } from 'react'

/**
 * Runs a row's 22f tint on the tab's clock, so it plays once. A CSS animation
 * starts again whenever its element is mounted or moved: paging back, a filter
 * that brings the row back, or React reordering it. On every commit, before
 * paint, the animation jumps to the time elapsed since the tint started; past
 * its 3 s hold and 300 ms fade, it is finished and the row shows no tint.
 *
 * @param tintStartedAt - The tab's time (`performance.now()`) the tint started,
 *   or `null` for no tint.
 * @returns The ref for the tinted row.
 */
export const useLiveChangeTint = (tintStartedAt: number | null) => {
  const ref = useRef<HTMLTableRowElement>(null)

  useLayoutEffect(() => {
    const row = ref.current

    if (row === null || tintStartedAt === null) return

    for (const animation of row.getAnimations()) {
      if (animation instanceof CSSAnimation) {
        animation.currentTime = performance.now() - tintStartedAt
      }
    }
  })

  return ref
}
