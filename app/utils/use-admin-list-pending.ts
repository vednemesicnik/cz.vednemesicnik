import { useLocation, useNavigation } from 'react-router'

// Pending state for admin lists: true while navigating to the same path,
// i.e. pagination/sort/search that only change the query string.
export const useAdminListPending = () => {
  const navigation = useNavigation()
  const location = useLocation()

  return (
    navigation.state === 'loading' &&
    navigation.location?.pathname === location.pathname
  )
}
