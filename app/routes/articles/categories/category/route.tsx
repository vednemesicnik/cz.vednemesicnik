import { href } from 'react-router'
import { ContentLink } from '~/components/content-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkCategories } from '~/components/content-link-categories'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { Pagination } from '~/components/pagination'
import { Paragraph } from '~/components/paragraph'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { articles, category, currentPage, pageSize, totalCount, totalPages } =
    loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Rubrika: {category.name}</Headline>
      </HeadlineGroup>

      {totalCount > 0 ? (
        <ContentList>
          {articles.map((article) => {
            return (
              <ContentListItem key={article.id}>
                <ContentLink
                  to={href('/articles/:articleSlug', {
                    articleSlug: article.slug,
                  })}
                >
                  <ContentLinkImage
                    alt={article.featuredImage?.altText}
                    image={article.featuredImage?.sources}
                  />
                  <ContentLinkTitle>{article.title}</ContentLinkTitle>
                  <ContentLinkFooter>
                    <ContentLinkCategories categories={article.categories} />
                    <ContentLinkAuthor>
                      {article.authors.map((author) => author.name).join(', ')}
                    </ContentLinkAuthor>
                    <ContentLinkPublishDate date={article.publishedAt} />
                  </ContentLinkFooter>
                </ContentLink>
              </ContentListItem>
            )
          })}
        </ContentList>
      ) : (
        <Paragraph>V této rubrice zatím nejsou žádné články.</Paragraph>
      )}

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </Page>
  )
}
