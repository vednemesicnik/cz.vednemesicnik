import type { ReactNode } from 'react'

import { StatusTag, type StatusTagState } from '~/components/status-tag'
import { Subheadline } from '~/components/subheadline'
import { useTaxonomyPage } from '~/components/taxonomy-page'
import { formatArticleCount } from '~/utils/format-article-count'

type Props = {
  previewState: StatusTagState | null
  className?: string
  children: ReactNode
}

/**
 * A `TaxonomyPage`'s line under the headline (11b): the kind, the article
 * count unless there is none, and a grey tag for a category or tag the reader
 * doesn't see (11e).
 *
 * @param props.previewState - The category's or tag's own state when the
 *   reader doesn't see it (11e), `null` when they do.
 * @param props.children - The kind: „Rubrika“ or „Štítek“.
 */
export const TaxonomyPageKind = ({
  previewState,
  className,
  children,
}: Props) => {
  const totalCount = useTaxonomyPage()

  return (
    <Subheadline className={className}>
      {children}
      {totalCount > 0 && ` · ${formatArticleCount(totalCount)}`}
      {previewState !== null && (
        <>
          {' '}
          <StatusTag muted state={previewState} />
        </>
      )}
    </Subheadline>
  )
}
