import { BulletedList } from '~/components/bulleted-list'
import { Headline } from '~/components/headline'
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
      <Headline marginBottom={false}>{loaderData.episode.title}</Headline>
      <Subheadline marginBottom={true} marginTop={true}>
        {formattedPublishDate}
      </Subheadline>
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
