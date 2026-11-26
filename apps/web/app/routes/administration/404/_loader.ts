import { data } from 'react-router'

export const loader = async () => {
  throw data(null, { status: 404 })
}
