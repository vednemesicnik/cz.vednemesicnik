// noinspection JSUnusedGlobalSymbols

import { href, redirect } from 'react-router'
import { requireCSRF } from '~/utils/csrf.server'

import type { Route } from './+types/route'
import { createDraftEpisode } from './utils/create-draft-episode.server'

// *Nová epizoda* is an action, not a page (log 0020, design 27d): the old
// address leads to the podcast, and a POST creates the draft and opens it.

export const loader = ({ params }: Route.LoaderArgs) =>
  redirect(
    href('/administration/podcasts/:podcastId', {
      podcastId: params.podcastId,
    }),
  )

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { podcastId } = params
  const { episodeId } = await createDraftEpisode(request, podcastId)

  return redirect(
    href(
      '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
      {
        episodeId,
        podcastId,
      },
    ),
  )
}
