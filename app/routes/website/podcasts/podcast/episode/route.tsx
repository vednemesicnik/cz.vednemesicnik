// noinspection JSUnusedGlobalSymbols

import { BulletedList } from '~/components/bulleted-list'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Hyperlink } from '~/components/hyperlink'
import { ListItem } from '~/components/list-item'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { podcastEpisode } = loaderData

  const formattedPublishDate = getFormattedPublishDate(
    podcastEpisode.publishedAt,
  )

  return (
    <Page>
      <HeadlineGroup>
        <Headline>{podcastEpisode.title}</Headline>
        <Subheadline>{formattedPublishDate}</Subheadline>
      </HeadlineGroup>
      <Paragraph>{podcastEpisode.description}</Paragraph>
      <BulletedList>
        {podcastEpisode.links.map((link) => (
          <ListItem key={link.id}>
            <Hyperlink href={link.url}>{link.label}</Hyperlink>
          </ListItem>
        ))}
      </BulletedList>
    </Page>
  )
}
