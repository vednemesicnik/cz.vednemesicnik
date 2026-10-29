const createLayoutOnlyRevalidation = () => {
  let isRunning = false

  return {
    /** Whether the running revalidation leaves the podcast's page out. */
    isRunning: () => isRunning,

    /**
     * Revalidates the page with the page itself left out, until it ends: React
     * Router asks the route's `shouldRevalidate` more than once per
     * revalidation.
     *
     * @param revalidate - The page's revalidation.
     */
    run: async (revalidate: () => Promise<void>) => {
      isRunning = true
      try {
        await revalidate()
      } finally {
        isRunning = false
      }
    },
  }
}

/**
 * A change of the podcast made elsewhere (22f, xkg6rdz4): its page's header
 * and episode rows follow through their live load of the rows on screen, so
 * the revalidation that carries the new title to the breadcrumb (the podcast
 * layout) leaves the page itself out, or its rows would move.
 */
export const layoutOnlyRevalidation = createLayoutOnlyRevalidation()
