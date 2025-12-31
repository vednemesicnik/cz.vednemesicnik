import { getPageTitle } from '~/utils/get-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const podcastTitle = loaderData.podcastEpisode.podcast.title ?? '...'
  const episodeTitle = loaderData.podcastEpisode.title ?? '...'
  const title = getPageTitle(`Podcasty - ${podcastTitle}: ${episodeTitle}`)

  return [{ title }]
}
