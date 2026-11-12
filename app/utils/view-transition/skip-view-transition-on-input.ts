import { handOnPress } from '~/utils/image-viewer/hand-on-press'
import { skipViewTransition } from '~/utils/view-transition/skip-view-transition'

/**
 * Lets the reader cut a page transition short (design 18d, u6r1pxsx): a press,
 * a key, the wheel or a touch skips it to its end and then acts, as during the
 * gallery's flight (12b). A press that Chrome hit-tested as `<html>` is handed
 * on to the element under it (`handOnPress`) at the next frame: right after
 * the skip, the point still hits the old page, and only the next frame has
 * the new one under the pointer. A scroll counts too, or the page would move
 * under a flying image and it would land beside its place.
 *
 * @returns The cleanup that stops listening, for when the transition ends.
 */
export const skipViewTransitionOnInput = () => {
  const controller = new AbortController()
  const options = { capture: true, passive: true, signal: controller.signal }

  const skipByPointer = (event: PointerEvent) => {
    skipViewTransition()
    requestAnimationFrame(() => handOnPress(event))
  }

  window.addEventListener('pointerdown', skipByPointer, options)
  window.addEventListener('keydown', skipViewTransition, options)
  window.addEventListener('wheel', skipViewTransition, options)
  window.addEventListener('touchstart', skipViewTransition, options)

  return () => controller.abort()
}
