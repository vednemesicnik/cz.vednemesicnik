// noinspection JSUnusedGlobalSymbols

import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form, useLoaderData } from "@remix-run/react"
import type { ParamParseKey } from "@remix-run/router"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { getAuthorization } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId/edit-link/:linkId">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Epizody - Upravit link" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { podcastId, episodeId, linkId } = params as RouteParams

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { id: true },
  })

  const linkPromise = prisma.podcastEpisodeLink.findUniqueOrThrow({
    where: { id: linkId },
    select: {
      id: true,
      label: true,
      url: true,
    },
  })

  const [podcast, episode, link] = await Promise.all([
    podcastPromise,
    episodePromise,
    linkPromise,
  ])

  return json({ podcast, episode, link })
}

export default function PodcastEpisodeAdministrationEditLink() {
  const { podcast, episode, link } = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Upravit link</h1>
      <Form method="post">
        <AuthenticityTokenInput />
        <input type="hidden" name="podcastId" value={podcast.id} />
        <input type="hidden" name="episodeId" value={episode.id} />
        <input type="hidden" name="linkId" value={link.id} />
        <label>
          Štítek
          <input type="text" name="label" defaultValue={link.label} />
        </label>
        <br />
        <label>
          URL
          <input type="url" name="url" defaultValue={link.url} />
        </label>
        <br />
        <button type="submit">Upravit odakz</button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const podcastId = formData.get("podcastId") as string
  const episodeId = formData.get("episodeId") as string
  const linkId = formData.get("linkId") as string
  const label = formData.get("label") as string
  const url = formData.get("url") as string

  // TODO: Add validation

  await prisma.podcastEpisodeLink.update({
    where: { id: linkId },
    data: {
      label,
      url,
    },
  })

  return redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
}
