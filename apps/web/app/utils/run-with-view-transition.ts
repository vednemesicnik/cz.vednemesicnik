/**
 * Runs an update inside a same-document view transition, so the page
 * cross-fades instead of repainting at once. The browser keeps the old frame
 * until the returned promise settles, so the update may wait for React to
 * commit. Without the API, or with reduced motion, the update runs as it is.
 *
 * @param update - The update; resolve it once the new state is on screen.
 */
export const runWithViewTransition = (update: () => Promise<void>) => {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (document.startViewTransition === undefined || prefersReducedMotion) {
    void update()
    return
  }

  document.startViewTransition(update)
}
