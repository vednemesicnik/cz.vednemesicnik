import { href } from 'react-router'
import { BulletedList } from '~/components/bulleted-list'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Link } from '~/components/link'
import { ListItem } from '~/components/list-item'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Rubriky</Headline>
      </HeadlineGroup>

      {categories.length > 0 ? (
        <BulletedList>
          {categories.map((category) => (
            <ListItem key={category.id}>
              <Link
                to={href('/articles/category/:slug', { slug: category.slug })}
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
