import type { SortOrder } from '~/utils/admin-list-params'
import { nameCollator } from '~/utils/name-collator'

type NamedRecord = {
  id: string
  name: string
}

type Options = {
  order: SortOrder
  page: number
  pageSize: number
}

/**
 * One page of categories or tags in Czech alphabetical order (design 25a),
 * as the web lists them (11c). SQLite compares bytes, which puts every capital
 * before any small letter and Š after Z, so the order is decided here.
 *
 * @param records - Every record the list matches, by id and name.
 * @returns The page's ids in order, and how many records the list matches.
 */
export const getNameOrderedPage = (
  records: NamedRecord[],
  { order, page, pageSize }: Options,
) => {
  const direction = order === 'asc' ? 1 : -1
  const orderedIds = [...records]
    .sort(
      (first, second) =>
        direction * nameCollator.compare(first.name, second.name),
    )
    .map((record) => record.id)

  return {
    pageIds: orderedIds.slice((page - 1) * pageSize, page * pageSize),
    totalCount: orderedIds.length,
  }
}
