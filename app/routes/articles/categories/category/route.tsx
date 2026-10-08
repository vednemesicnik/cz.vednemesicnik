import { href } from 'react-router'
import { Badge } from '~/components/badge'
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
import { ParentLink } from '~/components/parent-link'
import { PostContentLink } from '~/components/post-content-link'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { articles, category, currentPage, pageSize, totalCount, totalPages } =
    loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>Rubrika: {category.name}</Headline>
      </HeadlineGroup>

      {totalCount > 0 ? (
        <ContentList>
          {articles.map((article) => {
            return (
              <ContentListItem key={article.id}>
                <PostContentLink
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
                    {article.categories.length > 0 && (
                      <ContentLinkCategories>
                        {article.categories.map((category) => (
                          <Badge key={category.slug}>{category.name}</Badge>
                        ))}
                      </ContentLinkCategories>
                    )}
                    <ContentLinkAuthor>
                      {article.authors.map((author) => author.name).join(', ')}
                    </ContentLinkAuthor>
                    <ContentLinkPublishDate date={article.publishedAt} />
                  </ContentLinkFooter>
                </PostContentLink>
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
