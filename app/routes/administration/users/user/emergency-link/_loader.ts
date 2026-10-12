import { data } from 'react-router'

// Only the issuing dialog on the user detail posts here (design 28e).
export const loader = () => {
  throw data(null, { status: 404 })
}
