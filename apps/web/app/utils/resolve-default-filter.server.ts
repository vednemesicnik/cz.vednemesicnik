import { redirect } from 'react-router'

import {
  type AdminListTableKey,
  FILTER_PRESET_PARAM,
  hasAdminListParams,
  validateFilterQuery,
} from '~/utils/admin-list-filters'
import { prisma } from '~/utils/db.server'

type ResolveDefaultFilterOptions = {
  tableKey: AdminListTableKey
  url: URL
  userId: string
}

/**
 * Applies the user's default preset for a table by redirecting a bare list visit to
 * the stored query. Call it at the top of a list loader, right after the permission
 * context — it either returns (nothing to do) or throws the redirect.
 *
 * Takes the normalized `url` loader argument rather than the `Request`: React Router
 * `.data` requests carry the raw `.data` path in `request.url`, which would end up in
 * the redirect target.
 *
 * @param options - `tableKey` of the list, its normalized `url`, and the viewer's `userId`.
 * @returns Nothing; a matching default preset is signalled by a thrown redirect.
 */
export const resolveDefaultFilter = async ({
  tableKey,
  url,
  userId,
}: ResolveDefaultFilterOptions): Promise<void> => {
  // Any explicit list param — including `filter=none` — means the URL was asked for,
  // so the default preset stays out of the way.
  if (hasAdminListParams(url.searchParams, tableKey)) {
    return
  }

  const filter = await prisma.filter.findFirst({
    select: { id: true, query: true },
    where: { isDefault: true, tableKey, userId },
  })

  if (filter === null) {
    return
  }

  // Re-validated on apply: the stored query may predate a schema change, and an
  // unusable one must leave the plain unfiltered list rather than a broken URL.
  const query = validateFilterQuery(filter.query, tableKey)

  if (query === null) {
    return
  }

  throw redirect(`${url.pathname}?${query}&${FILTER_PRESET_PARAM}=${filter.id}`)
}
