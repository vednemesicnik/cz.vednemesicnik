import { useLiveRows } from '~/hooks/use-live-rows'

import type { Route } from '../+types/route'

type LoaderData = Route.ComponentProps['loaderData']

/**
 * Keeps the article list live without moving its rows (design 22f); see
 * {@link useLiveRows}. The waiting work and the Stav counts follow too.
 *
 * @param loaderData - The list as last loaded.
 * @returns The rows to show, the live counts and the rows changed by someone
 *   else since the list was opened.
 */
export const useLiveArticleRows = (loaderData: LoaderData) => {
  const { live, liveChanges, rows } = useLiveRows({
    authorId: loaderData.authorId,
    fetcherKey: 'article-list-live',
    // A renamed or removed category or tag reloads the rows that name it,
    // without a tint: the article itself did not change (0035, 31a).
    filter: (event) =>
      event.entity === 'article' ||
      event.entity === 'article_category' ||
      event.entity === 'article_tag',
    heldUntilOf: (data) => data.articles.map((article) => article.heldUntil),
    // Only the article's own change tints its row.
    keyOf: (event) => (event.entity === 'article' ? event.entityId : null),
    loaderData,
    rowsOf: (data) => data.articles,
  })

  return {
    articles: rows,
    liveChanges,
    pendingCount: live.pendingCount,
    queueCounts: live.queueCounts,
  }
}
