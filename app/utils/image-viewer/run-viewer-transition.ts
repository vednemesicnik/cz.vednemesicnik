// The one name the photo carries in flight: on the tile's image or on the
// viewer's frame, never on both.
const PHOTO_NAME = 'gallery-photo'

type Kind = 'open' | 'close'

type Options = {
  kind: Kind
  from: HTMLElement | null
  getTo: () => HTMLElement | null
  update: () => void | Promise<void>
}

const namedElements = new Set<HTMLElement>()
let latestRun = 0

const name = (element: HTMLElement | null) => {
  if (element === null) return

  element.style.setProperty('view-transition-name', PHOTO_NAME)
  namedElements.add(element)
}

const clearNames = () => {
  for (const element of namedElements) {
    element.style.removeProperty('view-transition-name')
  }

  namedElements.clear()
}

/**
 * Opens or closes the gallery viewer in a same-document view transition, so
 * the photo flies between its tile and the viewer (design 12b, l18gjrxu).
 * `<html>` carries `data-viewer-transition` for the run, which the viewer's
 * styles time by. With reduced motion nothing is named and the page only
 * cross-fades; without the API the update runs as it is.
 *
 * A newer run skips the one in flight, and only the newest one moves or
 * clears the names.
 *
 * @param options.from - The photo now: the tile's image, or the frame.
 * @param options.getTo - The photo after the update.
 * @param options.update - Shows or hides the viewer; resolve it once the new
 *   state is on screen.
 */
export const runViewerTransition = ({ kind, from, getTo, update }: Options) => {
  if (document.startViewTransition === undefined) {
    void update()
    return
  }

  const isMotionReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const run = ++latestRun
  const isLatest = () => run === latestRun

  clearNames()
  if (!isMotionReduced) name(from)
  document.documentElement.dataset.viewerTransition = kind

  const transition = document.startViewTransition(async () => {
    if (!isLatest()) {
      await update()
      return
    }

    clearNames()
    await update()

    if (!isMotionReduced && isLatest()) name(getTo())
  })

  // A skipped run rejects `ready`; nothing waits on it.
  transition.ready.catch(() => {})
  transition.finished
    .catch(() => {})
    .finally(() => {
      if (!isLatest()) return

      clearNames()
      delete document.documentElement.dataset.viewerTransition
    })
}
