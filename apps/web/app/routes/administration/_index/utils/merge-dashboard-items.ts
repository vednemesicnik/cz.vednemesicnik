type Sortable = {
  key: string
  sortAt: string | null
}

type Options = {
  direction: 'asc' | 'desc'
  take?: number
}

/**
 * One section of the dashboard from the rows of each type (design 21a): in
 * the section's order across the types, cut to its length. A row without
 * the moment goes last, whatever the direction.
 *
 * @param groups - Each type's rows, already in the section's order.
 * @param options.direction - Oldest first (the queue) or newest first.
 * @param options.take - How many rows the section shows at most.
 * @returns The merged rows.
 */
export const mergeDashboardItems = <Item extends Sortable>(
  groups: Item[][],
  { direction, take }: Options,
): Item[] => {
  const sign = direction === 'asc' ? 1 : -1
  const merged = groups.flat().sort((first, second) => {
    if (first.sortAt === second.sortAt) {
      return first.key.localeCompare(second.key)
    }
    if (first.sortAt === null) return 1
    if (second.sortAt === null) return -1

    return sign * first.sortAt.localeCompare(second.sortAt)
  })

  return take === undefined ? merged : merged.slice(0, take)
}
