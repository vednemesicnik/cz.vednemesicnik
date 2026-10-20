import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'

type Holder = {
  year: number
  order: number
  name: string | null
  supplement: string | null
}

type IssueNumberConflict = {
  field: 'order' | 'supplement'
  message: string
}

/**
 * What the add and edit forms say when the year, order and supplement are taken
 * (design 26d, copy kuel08rt): at the order for a main issue, naming the holder
 * when it has a name, at the supplement for a supplement. The whole form is sent
 * at once and nothing is saved, so no closing sentence.
 *
 * @param holder - The issue that holds the number; its name only when the
 *   viewer may see it.
 * @returns The field the message stands under and the message.
 */
export const getIssueNumberConflictMessage = (
  holder: Holder,
): IssueNumberConflict => {
  const orderLabel = getIssueOrderLabel(holder)

  if (holder.supplement) {
    return {
      field: 'supplement',
      message: `Zkontrolujte rok, pořadí a název doplňku — doplněk ${holder.supplement} pro ${orderLabel} už existuje.`,
    }
  }

  return {
    field: 'order',
    message: holder.name
      ? `Zvolte jiné pořadí — ${orderLabel} už má číslo ${holder.name} ${holder.year}.`
      : `Zvolte jiné pořadí — číslo ${orderLabel} už existuje.`,
  }
}
