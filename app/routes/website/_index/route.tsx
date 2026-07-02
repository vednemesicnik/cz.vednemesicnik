// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { ArticleHero } from '~/components/public/article-hero'
import { Subheadline } from '~/components/subheadline'
import type { Route } from './+types/route'

export { links } from './_links'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { latestPublishedArticle } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Čti, poslouchej a objevuj</Headline>
        <Subheadline>Vedneměsíčník je místo pro studentskou tvorbu</Subheadline>
      </HeadlineGroup>

      {latestPublishedArticle && (
        <ArticleHero
          authors={latestPublishedArticle.authors}
          image={latestPublishedArticle.featuredImage?.sources}
          imageAlt={latestPublishedArticle.featuredImage?.altText}
          publishDate={latestPublishedArticle.publishedAt}
          title={latestPublishedArticle.title}
          to={href('/articles/:articleSlug', {
            articleSlug: latestPublishedArticle.slug,
          })}
        />
      )}
    </Page>
  )
}
