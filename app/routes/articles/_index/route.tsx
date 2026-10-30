import { href } from 'react-router'
import { Badge } from '~/components/badge'
import { Callout } from '~/components/callout'
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
import { Hyperlink } from '~/components/hyperlink'
import { NavRow } from '~/components/nav-row'
import { NavRowItem } from '~/components/nav-row-item'
import { NavRowMore } from '~/components/nav-row-more'
import { Page } from '~/components/page'
import { Pagination } from '~/components/pagination'
import { PostContentLink } from '~/components/post-content-link'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    articles,
    categoryLinks,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
  } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Čtení, které vás chytne</Headline>
        {categoryLinks.length > 0 && (
          <NavRow label={'Rubriky'}>
            {categoryLinks.map((category) => (
              <NavRowItem
                key={category.slug}
                to={href('/articles/categories/:slug', {
                  slug: category.slug,
                })}
              >
                {category.name}
              </NavRowItem>
            ))}
            <NavRowMore to={href('/articles/categories')}>
              Všechny rubriky
            </NavRowMore>
          </NavRow>
        )}
      </HeadlineGroup>

      <ContentList>
        {articles.map((article) => {
          return (
            <ContentListItem key={article.id}>
              <PostContentLink
                isPreview={article.previewState !== null}
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
                  <ContentLinkPublishDate
                    date={article.publishedAt}
                    previewState={article.previewState}
                  />
                </ContentLinkFooter>
              </PostContentLink>
            </ContentListItem>
          )
        })}
      </ContentList>

      <Pagination
        currentPage={currentPage}
        noun={'článků'}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />

      <Callout>
        Starší články si můžete přečíst na platformě{' '}
        <Hyperlink href={'https://medium.com/vednemesicnik'}>Medium</Hyperlink>.
      </Callout>
    </Page>
  )
}
