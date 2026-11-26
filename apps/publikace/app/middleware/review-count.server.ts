import { Auth } from 'remix/middleware/auth'
import { createContextKey, type Middleware } from 'remix/router'

import type { ArticleStore } from '../data/articles.server.ts'
import type { ArtworkStore } from '../data/artworks.server.ts'
import type { Person } from './auth.server.ts'

/**
 * How many cards _Ke kontrole_ holds, of artworks and of articles, for the number beside it in
 * the panel (`Panel.dc.html`). Read with `context.get(ReviewCount)`; the panel reads it from the
 * request it is drawn in, as `CsrfField` reads its token, so no page has to pass it down.
 */
export const ReviewCount = createContextKey<number>(0)

export function loadReviewCount(
  artworks: ArtworkStore,
  articles: ArticleStore,
): Middleware<{
  key: typeof ReviewCount
  property: 'reviewCount'
  value: number
}> {
  /* Only for a signed-in editor-in-chief: the sign-in and the pages behind a link draw no panel,
     and a proofreader's has no _Ke kontrole_. A form refused with its page drawn again keeps its
     count. */
  return async (context, next) => {
    let state = context.get(Auth)
    if (state?.ok === true && (state.identity as Person).isEditor) {
      let [batches, clauses] = await Promise.all([artworks.reviewCount(), articles.reviewCount()])
      context.set(ReviewCount, batches + clauses)
    }
    return next()
  }
}
