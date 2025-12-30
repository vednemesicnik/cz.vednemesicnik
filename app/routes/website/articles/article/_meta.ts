import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  if (loaderData === undefined) {
    return [{ title: 'Článek nenalezen' }]
  }

  return [
    { title: loaderData.article.title },
    { content: loaderData.article.title, name: 'description' },
  ]
}
