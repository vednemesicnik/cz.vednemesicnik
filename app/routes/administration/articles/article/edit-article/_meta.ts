import { getArticleDisplayTitle } from '~/routes/administration/articles/utils/get-article-display-title'
import { createAdminEditPageTitle } from '~/utils/create-admin-edit-page-title'
import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  // Without a title, the empty draft included, it is Článek bez názvu (jri2vk3h).
  const title =
    loaderData === undefined
      ? createAdminPageTitle('Upravit článek')
      : createAdminEditPageTitle(
          getArticleDisplayTitle(loaderData.article.title),
        )

  return [{ title }]
}
