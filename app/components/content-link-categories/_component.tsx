import { Badge } from '~/components/badge'
import { BadgeList } from '~/components/badge-list'

type Category = {
  name: string
  slug: string
}

type Props = {
  categories: Category[]
}

/**
 * Category badges for an article card footer. The badges are non-link `span`s
 * (the whole card is already a link, so a nested anchor would be invalid).
 * Renders nothing when the article has no categories.
 */
export const ContentLinkCategories = ({ categories }: Props) => {
  if (categories.length === 0) {
    return null
  }

  return (
    <BadgeList>
      {categories.map((category) => (
        <Badge key={category.slug}>{category.name}</Badge>
      ))}
    </BadgeList>
  )
}
