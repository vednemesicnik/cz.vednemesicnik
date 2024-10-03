// noinspection JSUnusedGlobalSymbols

import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { type ParamParseKey } from "@remix-run/router"

import { Headline } from "app/components/headline"
import { Page } from "~/components/page"
import { Podcast } from "~/components/podcast"
import { PodcastCover } from "~/components/podcast-cover"
import { PodcastEpisodeList } from "~/components/podcast-episode-list"
import { PodcastEpisodeListItem } from "~/components/podcast-episode-list-item"
import { PodcastSubtitle } from "~/components/podcast-subtitle"
import { PodcastTitle } from "~/components/podcast-title"
import { prisma } from "~/utils/db.server"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"

const ROUTE = "podcasts/:slug"
type RouteParams = Record<ParamParseKey<typeof ROUTE>, string>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Podcast" }]
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params as RouteParams

  const podcast = await prisma.podcast.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      episodes: {
        select: {
          id: true,
          title: true,
          description: true,
          publishedAt: true,
          published: true,
          links: {
            select: {
              id: true,
              label: true,
              url: true,
            },
          },
        },
      },
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
    },
  })

  return json({ podcast })
}

export default function PodcastPage() {
  const { podcast } = useLoaderData<typeof loader>()

  if (podcast === null) {
    return (
      <Page>
        <Headline>Podcast</Headline>
        <p>Podcast nebyl nalezen.</p>
      </Page>
    )
  }

  const coverAlt = podcast.cover?.altText ?? ""
  const coverSrc = getPodcastCoverSrc(podcast.cover?.id ?? "")

  return (
    <Page>
      <Headline>Podcast</Headline>

      <Podcast>
        <PodcastCover src={coverSrc} alt={coverAlt} />
        <PodcastTitle>{podcast.title}</PodcastTitle>
        <PodcastSubtitle>{podcast.description}</PodcastSubtitle>

        <PodcastEpisodeList>
          {podcast.episodes ? (
            podcast.episodes.map((episode) => {
              if (episode.published === false) {
                return null
              }

              return (
                <PodcastEpisodeListItem key={episode.id}>
                  <h4>{episode.title}</h4>
                  <p>{episode.description}</p>
                  <p>
                    Publikováno:{" "}
                    {new Date(episode.publishedAt ?? "").toLocaleDateString("cs-CZ", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <ul>
                    {episode.links.map((link) => {
                      return (
                        <li key={link.id}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.label}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </PodcastEpisodeListItem>
              )
            })
          ) : (
            <li>...</li>
          )}
        </PodcastEpisodeList>
      </Podcast>
    </Page>
  )
}
