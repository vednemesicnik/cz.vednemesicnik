import { useSearchParams } from 'react-router'

import { LinkButton } from '~/components/link-button'
import { buildClearFiltersSearch } from '~/utils/build-clear-filters-search'

type Props = {
  className?: string
}

/**
 * Zrušit filtry as the way back from an empty result (design 22e): the same
 * target as the link at the end of the filter row.
 *
 * @returns The button
 */
export const ClearFiltersButton = ({ className }: Props) => {
  const [searchParams] = useSearchParams()

  return (
    <LinkButton
      className={className}
      preventScrollReset={true}
      to={{ search: buildClearFiltersSearch(searchParams) }}
      variant={'outline'}
    >
      Zrušit filtry
    </LinkButton>
  )
}
