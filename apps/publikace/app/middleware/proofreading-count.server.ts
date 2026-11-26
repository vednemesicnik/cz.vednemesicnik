import { Auth } from 'remix/middleware/auth'
import { createContextKey, type Middleware } from 'remix/router'

import type { ArticleStore } from '../data/articles.server.ts'
import type { Person } from './auth.server.ts'

/**
 * How many articles wait for a proofreader in _Čeká na korekturu_, for the number beside
 * _Korektura_ in the panel (`15a`). Read with `context.get(ProofreadingCount)`, as `ReviewCount`.
 */
export const ProofreadingCount = createContextKey<number>(0)

export function loadProofreadingCount(articles: ArticleStore): Middleware<{
  key: typeof ProofreadingCount
  property: 'proofreadingCount'
  value: number
}> {
  /* Only for a proofreader: the editors-in-chief get no number, nothing there waits on them. */
  return async (context, next) => {
    let state = context.get(Auth)
    if (state?.ok === true && (state.identity as Person).isProofreader) {
      context.set(ProofreadingCount, await articles.queueCount())
    }
    return next()
  }
}
