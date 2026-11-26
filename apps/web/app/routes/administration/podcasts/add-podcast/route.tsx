// noinspection JSUnusedGlobalSymbols

import { href, redirect } from 'react-router'
import { requireCSRF } from '~/utils/csrf.server'

import type { Route } from './+types/route'
import { createDraftPodcast } from './utils/create-draft-podcast.server'

// *Nový podcast* is an action, not a page (log 0020, design 27e, r1lh527v):
// the old address leads to the list, and a POST creates the draft and opens
// it.

export const loader = () => redirect(href('/administration/podcasts'))

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { podcastId } = await createDraftPodcast(request)

  return redirect(
    href('/administration/podcasts/:podcastId/edit-podcast', { podcastId }),
  )
}
