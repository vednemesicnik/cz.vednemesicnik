import { invariantResponse } from '@epic-web/invariant'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { deleteEpisode } from '../episode/_index/utils/delete-episode'
import type { Route } from './+types/route'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

// Matches the bulk-actions bar cap — selection is offered per page.
const MAX_SELECTION = 20

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { podcastId } = params
  // Guard the scope key: a missing podcastId would make Prisma drop the filter
  // and let the action reach episodes across all podcasts.
  invariantResponse(podcastId, 'Missing podcast id')

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(intent === INTENT_VALUE.bulkDelete, 'Invalid intent')

  // Trim, drop empty values, and de-duplicate before the size guard so forged
  // `ids=` fields and repeated ids can't slip past validation or cause no-op /
  // repeated deletes.
  const ids = [
    ...new Set(
      formData
        .getAll('ids')
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter((id) => id !== ''),
    ),
  ]
  invariantResponse(
    ids.length > 0 && ids.length <= MAX_SELECTION,
    'Invalid selection size',
  )

  // Scope to this podcast so forged ids from another podcast can't be deleted.
  const episodes = await prisma.podcastEpisode.findMany({
    select: { authorId: true, id: true, state: true },
    where: { id: { in: ids }, podcastId },
  })

  // Sequential on purpose: each delete runs its own permission check and
  // image-cleanup transaction. Not atomic across items — the UI only offers
  // deletable rows; the per-item check is defense in depth.
  for (const episode of episodes) {
    await deleteEpisode(request, {
      id: episode.id,
      target: { authorIds: [episode.authorId], state: episode.state },
    })
  }

  // App convention: the bulk-delete hook clears the selection only on an
  // explicit success. A denied item throws inside deleteEpisode before we get
  // here, so the selection stays for retry.
  return { status: 'success' as const }
}
