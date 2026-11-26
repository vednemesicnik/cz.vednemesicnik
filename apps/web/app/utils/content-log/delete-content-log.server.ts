import type { ContentLogEntity } from '@generated/prisma/enums'

import { prisma } from '~/utils/db.server'

/**
 * Removes a deleted content's history: „s článkem zmizí i jeho historie“
 * (07f). Never rejects, so a failure can't turn a finished delete into an
 * error; it only leaves rows nothing reads.
 *
 * @param content - The deleted content's entity and id.
 */
export const deleteContentLog = ({
  entity,
  entityId,
}: {
  entity: ContentLogEntity
  entityId: string
}): Promise<void> =>
  prisma.contentLog
    .deleteMany({ where: { entity, entityId } })
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error('Failed to delete content log', error)
    })
