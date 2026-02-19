import { href } from 'react-router'
import { ContentLink } from '~/components/content-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Callout } from '~/components/callout'
import { Hyperlink } from '~/components/hyperlink'
import { Page } from '~/components/page'
import { Pagination } from '~/components/pagination'
import { Paragraph } from '~/components/paragraph'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { articles, currentPage, totalPages } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Čtení, které vás chytne</Headline>
      </HeadlineGroup>

      <ContentList>
        {articles.map((article) => {
          const featuredImageSrc =
            article.featuredImage?.id !== undefined
              ? href('/resources/article-image/:imageId', {
                  imageId: article.featuredImage.id,
                })
              : undefined

          return (
            <ContentListItem key={article.id}>
              <ContentLink
                to={href('/articles/:articleSlug', {
                  articleSlug: article.slug,
                })}
              >
                <ContentLinkImage
                  alt={article.featuredImage?.altText}
                  src={featuredImageSrc}
                />
                <ContentLinkTitle>{article.title}</ContentLinkTitle>
                <ContentLinkFooter>
                  <ContentLinkAuthor>{article.author.name}</ContentLinkAuthor>
                  <ContentLinkPublishDate date={article.publishedAt} />
                </ContentLinkFooter>
              </ContentLink>
            </ContentListItem>
          )
        })}
      </ContentList>

      <Pagination currentPage={currentPage} totalPages={totalPages} />

      <Callout>
        <Paragraph>
          Všechny naše starší články si můžete přečíst na platformě{' '}
          <Hyperlink href={'https://medium.com/vednemesicnik'}>
            Medium
          </Hyperlink>
          .
        </Paragraph>
      </Callout>
    </Page>
  )
}
