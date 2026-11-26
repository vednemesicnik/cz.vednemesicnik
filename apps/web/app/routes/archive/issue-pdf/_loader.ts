import { data } from 'react-router'

// Runs only when the middleware found no PDF to serve.
export const loader = () => {
  throw data(null, { status: 404 })
}
