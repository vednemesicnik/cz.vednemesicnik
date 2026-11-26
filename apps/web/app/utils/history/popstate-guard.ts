/** Handles a `popstate` before React Router; `true` hides it from the router. */
type PopStateInterceptor = (event: PopStateEvent) => boolean

const createPopStateGuard = () => {
  const interceptors = new Set<PopStateInterceptor>()
  let isInstalled = false

  const handlePopState = (event: PopStateEvent) => {
    for (const interceptor of interceptors) {
      if (interceptor(event)) {
        event.stopImmediatePropagation()
        return
      }
    }
  }

  return {
    /**
     * Listens to `popstate` ahead of React Router. Call it in
     * `entry.client.tsx` before hydration: at the `window` target listeners
     * run in the order they were added, the capture phase included, so only
     * one added before the router's runs first. Once only.
     */
    install: () => {
      if (isInstalled) return

      isInstalled = true
      window.addEventListener('popstate', handlePopState, { capture: true })
    },
    /**
     * Sees every `popstate` before the router until released.
     *
     * @param interceptor - Returns `true` for a pop it handled, which the
     *   router then never sees.
     * @returns A function that stops the interceptor.
     */
    intercept: (interceptor: PopStateInterceptor) => {
      interceptors.add(interceptor)

      return () => {
        interceptors.delete(interceptor)
      }
    },
  }
}

/**
 * The page's one guard over `popstate`, ahead of React Router: it lets an
 * overlay handle Back without the router navigating (`useViewerHistory`).
 */
export const popStateGuard = createPopStateGuard()
