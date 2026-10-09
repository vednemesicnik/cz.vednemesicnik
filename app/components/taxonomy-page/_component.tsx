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
import { EmptyState } from '~/components/empty-state'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { Pagination } from '~/components/pagination'
import { ParentLink } from '~/components/parent-link'
import { PostContentLink } from '~/components/post-content-link'
import { Subheadline } from '~/components/subheadline'
import type { Breadcrumb } from '~/types/breadcrumb'
import { formatArticleCount } from '~/utils/format-article-count'
import type { FormattedDate } from '~/utils/format-date'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

type TaxonomyArticle = {
  authors: { name: string }[]
  categories: { name: string; slug: string }[]
  featuredImage: { altText: string; sources: ImageSources } | null
  id: string
  publishedAt: FormattedDate
  slug: string
  title: string
}

type Props = {
  articles: TaxonomyArticle[]
  currentPage: number
  kindLabel: string
  name: string
  pageSize: number
  parent: Breadcrumb | undefined
  totalCount: number
  totalPages: number
}

/**
 * The page of one category or tag (design 11b): the name as the headline, the
 * kind and article count under it, the article rows and pagination. Both routes
 * render it; they differ only in `kindLabel` and the parent link.
 *
 * The empty state shows only above a list the page really displays empty, so a
 * draft in the editorial preview suppresses it (10d).
 *
 * @param kindLabel - The word under the headline: "Rubrika" or "Štítek"
 * @param parent - The index one level up ("‹ Rubriky", "‹ Štítky")
 * @param totalCount - The articles the visitor can see, which the count states
 * @returns The taxonomy page
 */
export const TaxonomyPage = ({
  articles,
  currentPage,
  kindLabel,
  name,
  pageSize,
  parent,
  totalCount,
  totalPages,
}: Props) => {
  const isEmpty = totalCount === 0

  return (
    <Page>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>{name}</Headline>
        <Subheadline>
          {isEmpty
            ? kindLabel
            : `${kindLabel} · ${formatArticleCount(totalCount)}`}
        </Subheadline>
      </HeadlineGroup>

      {isEmpty ? (
        <EmptyState link={{ label: 'Všechny články', to: href('/articles') }}>
          Tady zatím žádný článek není.
        </EmptyState>
      ) : (
        <ContentList>
          {articles.map((article) => (
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
          ))}
        </ContentList>
      )}

      <Pagination
        currentPage={currentPage}
        noun={'článků'}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </Page>
  )
}
