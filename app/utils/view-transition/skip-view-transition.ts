/**
 * Skips the running view transition to its end. React starts the page's
 * transitions itself and hands out no transition object, so this finishes
 * every animation on a `::view-transition` pseudo-element, the same list
 * React walks once the transition is ready; with none left running, the
 * transition ends and the live page shows.
 */
export const skipViewTransition = () => {
  const animations = document.documentElement.getAnimations({ subtree: true })

  for (const animation of animations) {
    const effect = animation.effect

    if (!(effect instanceof KeyframeEffect)) continue
    if (!effect.pseudoElement?.startsWith('::view-transition')) continue

    animation.finish()
  }
}
