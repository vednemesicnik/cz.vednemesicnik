import { createContext, type ReactNode, useContext } from 'react'
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
import { EmptyStateLink } from '~/components/empty-state-link'
import { EmptyStateText } from '~/components/empty-state-text'
import { Page } from '~/components/page'
import { Pagination } from '~/components/pagination'
import { PostContentLink } from '~/components/post-content-link'
import type { StatusTagState } from '~/components/status-tag'
import type { FormattedDate } from '~/utils/format-date'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

type TaxonomyArticle = {
  authors: { name: string }[]
  categories: {
    name: string
    previewState: StatusTagState | null
    slug: string
  }[]
  featuredImage: { altText: string; sources: ImageSources } | null
  id: string
  previewState: StatusTagState | null
  publishedAt: FormattedDate
  slug: string
  title: string
}

const Context = createContext<number | undefined>(undefined)

type Props = {
  articles: TaxonomyArticle[]
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  children: ReactNode
}

/**
 * The page of one category or tag (design 11b): the head, the article rows and
 * pagination. Both routes render it, each with its own head.
 *
 * The empty state shows only above a list the page really displays empty, so a
 * draft in the editorial preview suppresses it (10d).
 *
 * @param props.children - The head: the `ParentLink` one level up
 *   („‹ Rubriky“), then a `HeadlineGroup` with the name as the `Headline` and
 *   `TaxonomyPageKind` under it
 * @param props.totalCount - The articles the visitor can see, which the kind
 *   line counts
 * @returns The taxonomy page
 */
export const TaxonomyPage = ({
  articles,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  children,
}: Props) => {
  const isEmpty = totalCount === 0

  return (
    <Page>
      <Context.Provider value={totalCount}>{children}</Context.Provider>

      {isEmpty ? (
        <EmptyState>
          <EmptyStateText>Tady zatím žádný článek není.</EmptyStateText>
          <EmptyStateLink to={href('/articles')}>Všechny články</EmptyStateLink>
        </EmptyState>
      ) : (
        <ContentList>
          {articles.map((article) => (
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
                        <Badge
                          isPreview={category.previewState !== null}
                          key={category.slug}
                        >
                          {category.name}
                        </Badge>
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

/**
 * The articles a `TaxonomyPage` counts, for its kind line.
 *
 * @returns The page's article count
 */
export const useTaxonomyPage = () => {
  const totalCount = useContext(Context)

  if (totalCount === undefined) {
    throw new Error('useTaxonomyPage must be used within a TaxonomyPage')
  }

  return totalCount
}
