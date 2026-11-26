import { href, redirect } from 'react-router'

import type { Route } from './+types/route'

// The profile and its subpages now live on the settings page itself; old
// bookmarks and e-mail links land there for good (design 30b).
export const loader = ({ url }: Route.LoaderArgs) => {
  throw redirect(`${href('/administration/settings')}${url.search}`, 301)
}
