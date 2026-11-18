import { createContextKey, type Middleware } from 'remix/router'

import type { ArticleStore } from '../data/articles.server.ts'
import type { LinkStore } from '../data/links.server.ts'
import type { ArticleSetup } from '../drive/article-setup.server.ts'
import type { ArtworksSetup } from '../drive/artworks-setup.server.ts'

/**
 * The links, the articles, and the way an article is made and its artworks sent. Read with
 * `context.get(Articles)`.
 */
export type ArticlesContext = {
  articles: ArticleStore
  artworks: ArtworksSetup
  links: LinkStore
  /** `APP_ORIGIN`: what a link is copied and shared with. */
  origin: string
  setup: ArticleSetup
}

export const Articles = createContextKey<ArticlesContext>()

/** Handed in rather than built here, like the issues, so a test runs on its own Drive and mail. */
export function loadArticles(
  articles: ArticlesContext,
): Middleware<{ key: typeof Articles; property: 'articles'; value: ArticlesContext }> {
  return (context, next) => {
    context.set(Articles, articles)
    return next()
  }
}
