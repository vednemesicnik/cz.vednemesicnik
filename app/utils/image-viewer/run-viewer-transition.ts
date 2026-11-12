import { handOnPress } from '~/utils/image-viewer/hand-on-press'

type Options = {
  kind: 'open' | 'close'
  update: () => void | Promise<void>
}

/**
 * Opens or closes the gallery viewer in a same-document view transition, so
 * the photo flies between its tile and the viewer (design 12b, l18gjrxu).
 * Only the start is here: the styles name the photo, time the flight and
 * honour reduced motion by the transition's types, `gallery-viewer` and
 * `open` or `close`. A browser with transitions but without types (Safari
 * 18.0–18.1, Firefox 144–146) runs the update as it is, as one without the
 * API does, and the viewer fades by itself.
 *
 * The flight delays nothing (1vd3dq22): a pointer or key going down while it
 * runs skips it to its end and then acts. A key goes to the focus as ever; a
 * press lands on `<html>` in Chrome and is handed on (`handOnPress`). So an
 * arrow pages, ×, Esc and Space close, a drag or swipe starts and a tile
 * opens again at once.
 *
 * @param options.update - Shows or hides the viewer; resolve it once the new
 *   state is on screen.
 */
export const runViewerTransition = ({ kind, update }: Options) => {
  if (!('ViewTransition' in window) || !('types' in ViewTransition.prototype)) {
    void update()
    return
  }

  const transition = document.startViewTransition({
    types: ['gallery-viewer', kind],
    update,
  })

  // A run skipped by a newer one rejects `ready`; nothing waits on it.
  transition.ready.catch(() => {})

  const options = { capture: true, passive: true }

  const skipByPointer = (event: PointerEvent) => {
    transition.skipTransition()
    handOnPress(event)
  }

  const skipByKey = () => transition.skipTransition()

  window.addEventListener('pointerdown', skipByPointer, options)
  window.addEventListener('keydown', skipByKey, options)

  transition.finished
    .catch(() => {})
    .finally(() => {
      window.removeEventListener('pointerdown', skipByPointer, options)
      window.removeEventListener('keydown', skipByKey, options)
    })
}
