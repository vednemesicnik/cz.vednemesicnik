import { href } from 'react-router'
import { Badge } from '~/components/badge'
import { BadgeList } from '~/components/badge-list'
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
import { Page } from '~/components/page'
import { Pagination } from '~/components/pagination'
import { Paragraph } from '~/components/paragraph'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { articles, currentPage, pageSize, tag, totalCount, totalPages } =
    loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Štítek: {tag.name}</Headline>
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
                    <ContentLinkAuthor>
                      {article.authors.map((author) => author.name).join(', ')}
                    </ContentLinkAuthor>
                    <ContentLinkPublishDate date={article.publishedAt} />
                  </ContentLinkFooter>
                </ContentLink>

                {article.categories.length > 0 && (
                  <BadgeList>
                    {article.categories.map((category) => (
                      <Badge
                        key={category.slug}
                        to={href('/articles/category/:slug', {
                          slug: category.slug,
                        })}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </BadgeList>
                )}
              </ContentListItem>
            )
          })}
        </ContentList>
      ) : (
        <Paragraph>Pod tímto štítkem zatím nejsou žádné články.</Paragraph>
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
