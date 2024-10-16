// noinspection JSUnusedGlobalSymbols

import { json, type MetaFunction } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Page } from "~/components/page"
import { prisma } from "~/utils/db.server"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Podcasty" }]
}

export const loader = async () => {
  const podcasts = await prisma.podcast.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
    },
  })

  return json({ podcasts })
}

export default function Podcasts() {
  const { podcasts } = useLoaderData<typeof loader>()

  return (
    <Page>
      <Headline>Podcasty</Headline>
      <br />
      <ul>
        {podcasts.map((podcast) => {
          const coverAlt = podcast.cover?.altText ?? ""
          const coverSrc = getPodcastCoverSrc(podcast.cover?.id ?? "")

          return (
            <li key={podcast.id}>
              <Link to={`/podcasts/${podcast.slug}`}>
                <h2>{podcast.title}</h2>
              </Link>
              <p>{podcast.description}</p>
              <img src={coverSrc} alt={coverAlt} width={200} />
            </li>
          )
        })}
      </ul>
    </Page>
  )
}
