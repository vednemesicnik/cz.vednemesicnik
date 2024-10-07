// noinspection JSUnusedGlobalSymbols

import { createId } from "@paralleldrive/cuid2"
import type { PodcastCover } from "@prisma/client"
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
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { hasFile } from "~/utils/has-file"
import { slugify } from "~/utils/slugify"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/edit/:podcastId">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Podcastů - Upravit podcast" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { podcastId } = params as RouteParams

  const podcast = await prisma.podcast.findUnique({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      cover: {
        select: {
          id: true,
        },
      },
    },
  })

  if (podcast === null) {
    throw new Response(null, {
      status: 404,
      statusText: "Podcast not found",
    })
  }

  return json({ podcast })
}

export default function AdministrationPodcastsEditPodcast() {
  const { podcast } = useLoaderData<typeof loader>()

  const [title, setTitle] = useState(podcast.title)
  const [slug, setSlug] = useState(podcast.slug)
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title))
    }
  }, [title, isSlugFocused])

  return (
    <>
      <h1>Přidat podcast</h1>
      <Form method="post" encType={"multipart/form-data"}>
        <AuthenticityTokenInput />
        <input type="hidden" name="podcastId" value={podcast.id} />
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
          Popis
          <textarea name="description" defaultValue={podcast.description} />
        </label>
        <br />
        <label>
          Obálka
          <input type="file" name="cover" accept={"image/*"} />
        </label>
        <input type="hidden" name="coverId" value={podcast.cover?.id} />
        <br />
        <button type="submit">Upravit podcast</button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await getMultipartFormData(request)

  await validateCSRF(formData, request.headers)

  const podcastId = formData.get("podcastId") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string
  const cover = formData.get("cover") as File
  const coverId = formData.get("coverId") as string

  // TODO: Add validation
  // Cover image should have a 200 kB maximum size

  const coverAltText = `Obálka podcastu ${title}`

  const coverData = (
    hasFile(cover)
      ? {
          id: createId(),
          altText: coverAltText,
          contentType: cover.type,
          blob: Buffer.from(await cover.arrayBuffer()),
        }
      : {
          altText: coverAltText,
        }
  ) satisfies Partial<PodcastCover>

  await prisma.podcast.update({
    where: { id: podcastId },
    data: {
      title,
      slug,
      description,
      cover: {
        update: {
          where: { id: coverId },
          data: coverData,
        },
      },
    },
  })

  return redirect("/administration/podcasts")
}
