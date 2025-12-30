import type { Route } from './+types/route'

export const meta = ({ data }: Route.MetaArgs) => {
  if (!data) {
    return [{ title: 'Článek nenalezen' }]
  }

  return [
    { title: data.article.title },
    { name: 'description', content: data.article.title },
  ]
}
