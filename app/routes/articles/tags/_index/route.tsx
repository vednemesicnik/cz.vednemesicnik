import { href } from 'react-router'
import { BulletedList } from '~/components/bulleted-list'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Link } from '~/components/link'
import { ListItem } from '~/components/list-item'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { ParentLink } from '~/components/parent-link'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { tags } = loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>Štítky</Headline>
      </HeadlineGroup>

      {tags.length > 0 ? (
        <BulletedList>
          {tags.map((tag) => (
            <ListItem key={tag.id}>
              <Link to={href('/articles/tags/:slug', { slug: tag.slug })}>
                {tag.name}
              </Link>{' '}
              ({tag.articleCount})
            </ListItem>
          ))}
        </BulletedList>
      ) : (
        <Paragraph>Zatím zde nejsou žádné štítky.</Paragraph>
      )}
    </Page>
  )
}
