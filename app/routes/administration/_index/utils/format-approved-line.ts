import { formatNumericDate } from '~/utils/format-numeric-date'

import { DASHBOARD_TYPE_COPY, type DashboardType } from '../dashboard-types'

const pluralRules = new Intl.PluralRules('cs')

type Options = {
  type: DashboardType
  count: number
  earliestApprovedAt: Date
}

/**
 * One line of *K publikaci* (design 21a, x24ele6l): how many of a type wait
 * for their order, and since when. The date is the approval's, not the
 * content's age.
 *
 * @returns „3 články · nejdřívější schválení 24. 9. 2026“; for one piece
 *   „1 epizoda, schválená 27. 9. 2026“, the adjective in the noun's gender.
 */
export const formatApprovedLine = ({
  type,
  count,
  earliestApprovedAt,
}: Options) => {
  const copy = DASHBOARD_TYPE_COPY[type]
  const noun = copy.countForms[pluralRules.select(count)]
  const date = formatNumericDate(earliestApprovedAt)

  return count === 1
    ? `1 ${noun}, ${copy.approvedOne} ${date}`
    : `${count} ${noun} · nejdřívější schválení ${date}`
}
