import { BulletedList } from '~/components/bulleted-list'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Hyperlink } from '~/components/hyperlink'
import { ListItem } from '~/components/list-item'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import type { Route } from './+types/route'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const formattedPublishDate = getFormattedPublishDate(
    loaderData.episode.publishedAt,
  )

  return (
    <>
      <HeadlineGroup>
        <Headline>{loaderData.episode.title}</Headline>
        <Subheadline>{formattedPublishDate}</Subheadline>
      </HeadlineGroup>
      <Paragraph>{loaderData.episode.description}</Paragraph>
      <BulletedList>
        {loaderData.episode.links.map((link) => (
          <ListItem key={link.id}>
            <Hyperlink href={link.url}>{link.label}</Hyperlink>
          </ListItem>
        ))}
      </BulletedList>
    </>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
