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
  const { categories } = loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>Rubriky</Headline>
      </HeadlineGroup>

      {categories.length > 0 ? (
        <BulletedList>
          {categories.map((category) => (
            <ListItem key={category.id}>
              <Link
                to={href('/articles/categories/:slug', {
                  slug: category.slug,
                })}
              >
                {category.name}
              </Link>{' '}
              ({category.articleCount})
            </ListItem>
          ))}
        </BulletedList>
      ) : (
        <Paragraph>Zatím zde nejsou žádné rubriky.</Paragraph>
      )}
    </Page>
  )
}
