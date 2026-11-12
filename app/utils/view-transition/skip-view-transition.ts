type DocumentWithActiveViewTransition = Document & {
  activeViewTransition?: ViewTransition | null
}

/**
 * Skips the running view transition to its end. React starts the page's
 * transitions itself and hands out no transition object, so this takes the
 * document's own (`document.activeViewTransition`). Where a browser hasn't got
 * it, it finishes every animation on a `::view-transition` pseudo-element, the
 * same list React walks once the transition is ready, and the transition ends
 * with them.
 */
export const skipViewTransition = () => {
  const { activeViewTransition } = document as DocumentWithActiveViewTransition

  if (activeViewTransition) {
    activeViewTransition.skipTransition()
    return
  }

  const animations = document.documentElement.getAnimations({ subtree: true })

  for (const animation of animations) {
    const effect = animation.effect

    if (!(effect instanceof KeyframeEffect)) continue
    if (!effect.pseudoElement?.startsWith('::view-transition')) continue

    animation.finish()
  }
}
