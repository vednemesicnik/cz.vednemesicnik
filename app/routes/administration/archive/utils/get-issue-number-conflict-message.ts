import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'

type Holder = {
  /** `null` when the viewer may not see the holder: it is named, not linked. */
  id: string | null
  year: number
  order: number
  name: string | null
  supplement: string | null
}

/** A taken number as the field shows it: the holder can be a link. */
export type IssueNumberConflict = {
  field: 'order' | 'supplement'
  before: string
  holder: { id: string | null; label: string }
  after: string
}

/**
 * What the editor says at the field when the year, order and supplement are
 * taken (design 26d, copy kuel08rt): at the order for a main issue, naming the
 * holder when it has a name, at the supplement for a supplement. The editor
 * adds „Změna … se neuložila.“ for the field that was changed.
 *
 * @param holder - The issue that holds the number; its name only when the
 *   viewer may see it.
 * @returns The field, and the sentence split around the holder.
 */
export const getIssueNumberConflictMessage = (
  holder: Holder,
): IssueNumberConflict => {
  const orderLabel = getIssueOrderLabel(holder) ?? ''

  if (holder.supplement) {
    return {
      after: ` pro ${orderLabel} už existuje.`,
      before: 'Zkontrolujte rok, pořadí a název doplňku — doplněk ',
      field: 'supplement',
      holder: { id: holder.id, label: holder.supplement },
    }
  }

  return holder.name
    ? {
        after: '.',
        before: `Zvolte jiné pořadí — ${orderLabel} už má číslo `,
        field: 'order',
        holder: { id: holder.id, label: `${holder.name} ${holder.year}` },
      }
    : {
        after: ' už existuje.',
        before: 'Zvolte jiné pořadí — číslo ',
        field: 'order',
        holder: { id: holder.id, label: orderLabel },
      }
}
