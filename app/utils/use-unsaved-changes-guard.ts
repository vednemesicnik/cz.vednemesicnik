import { useCallback, useEffect, useRef } from 'react'
import { useBlocker, useNavigation } from 'react-router'

type Params = {
  isDirty: boolean
  onLeave: () => void
}

// Guards a dirty form against silent data loss: a native prompt on real document
// unload (tab close / reload) and an in-app navigation blocker whose dialog the
// caller renders from the returned `blocker`. `onLeave` runs a save-on-leave
// backup and is invoked on pagehide (and by the caller on a confirmed leave).
export const useUnsavedChangesGuard = ({ isDirty, onLeave }: Params) => {
  const navigation = useNavigation()

  // Keep the latest onLeave without re-registering the unload listeners on every
  // keystroke (onLeave closes over the changing form value).
  const onLeaveRef = useRef(onLeave)
  onLeaveRef.current = onLeave

  // Exempts our own submission from the in-app blocker so the post-submit
  // redirect isn't caught. Only consulted by the blocker — the native unload
  // events don't fire on client-side navigations.
  const isSubmittingRef = useRef(false)
  const markSubmitting = useCallback(() => {
    isSubmittingRef.current = true
  }, [])

  // A submission that returns without leaving (server validation error) settles
  // back to idle; re-arm the blocker. A successful submit redirects away and
  // unmounts, so no reset is needed there.
  useEffect(() => {
    if (navigation.state === 'idle') isSubmittingRef.current = false
  }, [navigation.state])

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Some browsers only show the native prompt when returnValue is also set.
      event.returnValue = ''
    }
    const handlePageHide = () => {
      onLeaveRef.current()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [isDirty])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isSubmittingRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  return { blocker, markSubmitting }
}
