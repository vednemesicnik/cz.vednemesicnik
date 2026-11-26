// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

export { handle } from './_handle'
export { loader } from './_loader'

export default function ArticleLayout() {
  return <Outlet />
}
