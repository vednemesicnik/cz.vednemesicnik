import type { ArticleQueue } from '~/config/article-queue-config'

// Where nothing was found, by the pill (design 22e); Vše has no queue.
const QUEUE_INTROS: Record<ArticleQueue, string> = {
  approved: 'Mezi schválenými články',
  archived: 'Mezi archivovanými články',
  draft: 'V konceptech',
  pending: 'Mezi články ke schválení',
  published: 'Mezi publikovanými články',
  submitted: 'Mezi odeslanými články',
}

const ALL_INTRO = 'Mezi všemi články'

type NoResultOptions = {
  queue: ArticleQueue | undefined
  query: string
  filterCount: number
}

type NoResultMessage = {
  sentence: string
  clearLabel: string
}

/**
 * The Nic nenalezeno of a search or a filter that found nothing (design 22e).
 * Call it only with a search or at least one filter.
 *
 * @param options - The pill's `queue`, the search `query` (`''` for none) and
 *   the number of active filters other than the queue.
 * @returns `sentence` — the queue, the search term and the filters by count;
 *   `clearLabel` — the button that clears the search, the filters or both,
 *   while the queue stays.
 */
export const getNoResultMessage = ({
  queue,
  query,
  filterCount,
}: NoResultOptions): NoResultMessage => {
  const hasQuery = query !== ''
  const hasFilters = filterCount > 0

  const intro = queue === undefined ? ALL_INTRO : QUEUE_INTROS[queue]
  const searchPart = hasQuery ? ` s výrazem „${query}“ v názvu nebo adrese` : ''
  const filterNoun = filterCount === 1 ? 'použitému filtru' : 'použitým filtrům'
  const filterPart = hasFilters
    ? hasQuery
      ? `, které odpovídají ${filterNoun} (${filterCount})`
      : ` odpovídající ${filterNoun} (${filterCount})`
    : ''

  const clearLabel =
    hasQuery && hasFilters
      ? 'Zrušit hledání a filtry'
      : hasQuery
        ? 'Zrušit hledání'
        : 'Zrušit filtry'

  return {
    clearLabel,
    sentence: `${intro} nejsou články${searchPart}${filterPart}.`,
  }
}
