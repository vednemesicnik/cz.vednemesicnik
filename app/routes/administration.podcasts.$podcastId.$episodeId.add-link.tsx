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
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId/add-link">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Epizody - Přidat link" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { podcastId, episodeId } = params as RouteParams

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { id: true },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  return json({ podcast, episode })
}

export default function PodcastEpisodeAdministrationAddLink() {
  const { podcast, episode } = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Přidat link</h1>
      <Form method="post">
        <AuthenticityTokenInput />
        <input type="hidden" name="podcastId" value={podcast.id} />
        <input type="hidden" name="episodeId" value={episode.id} />
        <label>
          Štítek
          <input type="text" name="label" />
        </label>
        <br />
        <label>
          URL
          <input type="url" name="url" />
        </label>
        <br />
        <button type="submit">Přidat odakz</button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const podcastId = formData.get("podcastId") as string
  const episodeId = formData.get("episodeId") as string
  const label = formData.get("label") as string
  const url = formData.get("url") as string

  // TODO: Add validation

  await prisma.podcastEpisodeLink.create({
    data: {
      label,
      url,
      episode: {
        connect: { id: episodeId },
      },
      author: {
        connect: { username: "owner" },
      },
    },
  })

  return redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
}
