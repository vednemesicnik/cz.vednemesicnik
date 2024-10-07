// noinspection JSUnusedGlobalSymbols

import type { PodcastCover } from "@prisma/client"
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form } from "@remix-run/react"
import { useEffect, useState } from "react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { getAuthorization } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { slugify } from "~/utils/slugify"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Podcastů - Přidat podcast" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "OK" })
}

export default function AdministrationPodcastsAddPodcast() {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
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
          <textarea name="description" />
        </label>
        <br />
        <label>
          Obálka
          <input type="file" name="cover" accept={"image/*"} />
        </label>
        <br />
        <button type="submit">Přidat podcast</button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await getMultipartFormData(request)

  await validateCSRF(formData, request.headers)

  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string
  const cover = formData.get("cover") as File

  // TODO: Add validation
  // Cover image should have a 200 kB maximum size

  const coverAltText = `Obálka podcastu ${title}`

  const coverData = {
    altText: coverAltText,
    contentType: cover.type,
    blob: Buffer.from(await cover.arrayBuffer()),
  } satisfies Partial<PodcastCover>

  await prisma.podcast.create({
    data: {
      title,
      slug,
      description,
      cover: {
        create: coverData,
      },
      author: {
        connect: { username: "owner" },
      },
    },
  })

  return redirect("/administration/podcasts")
}
