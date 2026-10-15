import { getArticleDisplayTitle } from '~/routes/administration/articles/utils/get-article-display-title'
import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit článek')
      : loaderData.article.isEmptyDraft
        ? createAdminPageTitle(getArticleDisplayTitle(loaderData.article.title))
        : createAdminEditPageTitle(loaderData.article.title)

  return [{ title }]
}
