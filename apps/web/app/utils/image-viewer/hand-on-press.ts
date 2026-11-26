/**
 * Hands a press that landed on `<html>` on to what lies under it. During a
 * view transition Chrome hit-tests the whole flight as `<html>`, even with
 * `pointer-events: none` on it, so a press that skipped the flight never
 * reached its element (design 12b, 1vd3dq22). Call it once the flight is
 * skipped, so the element under the pointer is the live one again.
 *
 * The pointer-down goes on to that element, so a drag, swipe or pinch
 * starts; the frame takes the pointer with `setPointerCapture`, and the rest
 * of the gesture follows it. The click that follows lands on `<html>` as well,
 * the common ancestor of where the press went down and came up, and goes on
 * to the button or link under the pointer. A press that ends without a click
 * (a drag, a cancel) leaves nothing behind.
 *
 * @param press - The pointer-down, as it reached `window`.
 */
export const handOnPress = (press: PointerEvent) => {
  if (press.target !== document.documentElement) return

  const target = document.elementFromPoint(press.clientX, press.clientY)

  if (target === null || target === document.documentElement) return

  target.dispatchEvent(new PointerEvent('pointerdown', press))

  const controller = new AbortController()
  const options = { capture: true, signal: controller.signal }
  const end = () => controller.abort()

  const handOnClick = (click: MouseEvent) => {
    end()

    if (click.target !== document.documentElement) return

    const control = target.closest('button, a')

    if (control instanceof HTMLElement) control.click()
  }

  window.addEventListener('click', handOnClick, options)
  window.addEventListener('pointercancel', end, options)
  // Added while this press is still being dispatched, so it waits for the next.
  window.addEventListener('pointerdown', end, options)
}
