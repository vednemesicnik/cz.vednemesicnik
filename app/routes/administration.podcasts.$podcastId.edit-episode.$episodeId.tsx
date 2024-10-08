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
import { useEffect, useState } from "react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { getAuthorization } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { slugify } from "~/utils/slugify"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/edit-episode/:episodeId">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Podcastu - Upravit epizodu" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { podcastId, episodeId } = params as RouteParams

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
    },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      published: true,
      publishedAt: true,
    },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  return json({ podcast, episode })
}

export default function PodcastAdministrationEditEpisode() {
  const { podcast, episode } = useLoaderData<typeof loader>()

  const [title, setTitle] = useState(episode.title)
  const [slug, setSlug] = useState(episode.slug)
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title))
    }
  }, [title, isSlugFocused])

  return (
    <>
      <h1>Upavit epizodu</h1>
      <Form method="post" encType={"multipart/form-data"}>
        <AuthenticityTokenInput />
        <input type="hidden" name="podcastId" value={podcast.id} />
        <input type="hidden" name="episodeId" value={episode.id} />
        <label>
          Název
          <input
            type="text"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <br />
        <label>
          Slug
          <input
            type="text"
            name="slug"
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            onFocus={() => setIsSlugFocused(true)}
          />
        </label>
        <br />
        <label>
          Popis
          <textarea name="description" defaultValue={episode.description} />
        </label>
        <br />
        <label>
          Publikováno
          <input
            type="checkbox"
            name="published"
            defaultChecked={episode.published}
          />
        </label>
        <br />
        <label>
          Publikováno dne
          <input
            type="date"
            name="publishedAt"
            defaultValue={episode.publishedAt?.split("T")[0] ?? ""}
          />
        </label>
        <br />
        <button type="submit">Upravit epizodu</button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const podcastId = formData.get("podcastId") as string
  const episodeId = formData.get("episodeId") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string
  const published = formData.get("published") === "on"
  const publishedAt = formData.get("publishedAt") as string

  // TODO: Add validation

  await prisma.podcastEpisode.update({
    where: { id: episodeId },
    data: {
      title,
      slug,
      description,
      published,
      publishedAt: new Date(publishedAt),
    },
  })

  return redirect(`/administration/podcasts/${podcastId}`)
}
