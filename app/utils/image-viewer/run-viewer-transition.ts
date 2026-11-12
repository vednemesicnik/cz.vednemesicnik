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
}
