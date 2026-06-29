import { useEffect, useLayoutEffect } from 'react'

// useLayoutEffect warns during SSR; fall back to useEffect on the server, where
// it is a no-op anyway. On the client we need the layout effect so it runs
// inside React Router's flushSync — before the new view-transition snapshot.
export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? useLayoutEffect : useEffect
