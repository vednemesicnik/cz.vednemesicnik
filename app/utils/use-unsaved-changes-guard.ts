import { useCallback, useEffect, useRef } from 'react'
import { useBlocker, useLocation, useNavigation } from 'react-router'

type Params = {
  isDirty: boolean
  onLeave: () => void
  onSubmittedAway: () => void
}

// Guards a dirty form against silent data loss: a native prompt on real document
// unload (tab close / reload) and an in-app navigation blocker whose dialog the
// caller renders from the returned `blocker`. `onLeave` runs a save-on-leave
// backup (pagehide + confirmed leave); `onSubmittedAway` runs once our own
// submit actually redirects away, i.e. on success.
export const useUnsavedChangesGuard = ({
  isDirty,
  onLeave,
  onSubmittedAway,
}: Params) => {
  const navigation = useNavigation()
  const location = useLocation()

  // Keep the latest callbacks without re-registering listeners/effects on every
  // keystroke (they close over the changing form value).
  const onLeaveRef = useRef(onLeave)
  onLeaveRef.current = onLeave
  const onSubmittedAwayRef = useRef(onSubmittedAway)
  onSubmittedAwayRef.current = onSubmittedAway

  // Marks our own submission so the in-app blocker lets its redirect through and
  // so the backup is cleared only when that redirect actually leaves the route.
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

  // Clear the backup only once our submit is actually navigating away to another
  // route (a successful redirect). A server validation error / expired session
  // revalidates to the same path, so the backup is kept.
  useEffect(() => {
    if (
      isSubmittingRef.current &&
      navigation.state === 'loading' &&
      navigation.location !== undefined &&
      navigation.location.pathname !== location.pathname
    ) {
      onSubmittedAwayRef.current()
    }
  }, [navigation, location.pathname])

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
