// noinspection JSUnusedGlobalSymbols

import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form, NavLink, useLoaderData } from "@remix-run/react"
import type { ParamParseKey } from "@remix-run/router"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Epizody" }]
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
    select: {
      id: true,
      title: true,
      links: {
        select: {
          id: true,
          label: true,
          url: true,
        },
      },
    },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  return json({ episode, podcast })
}

export default function PodcastEpisodeAdministration() {
  const { episode, podcast } = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Administrace Epizody</h1>
      <NavLink
        to={`/administration/podcasts/${podcast.id}/${episode.id}/add-link`}
        preventScrollReset={true}
      >
        Přidat odkaz
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Štítek</th>
            <th>URL</th>
            <th>Akce</th>
          </tr>
        </thead>
        {episode.links.map((link) => (
          <tr key={link.id}>
            <td>{link.label}</td>
            <td>{link.url}</td>
            <td>
              <NavLink
                to={`/administration/podcasts/${podcast.id}/${episode.id}/edit-link/${link.id}`}
              >
                Upravit
              </NavLink>
              <Form
                method="post"
                action={`/administration/podcasts/${podcast.id}/${episode.id}/delete-link/${link.id}`}
                preventScrollReset={true}
              >
                <AuthenticityTokenInput />
                <Button type="submit" variant={"danger"}>
                  Odstranit
                </Button>
              </Form>
            </td>
          </tr>
        ))}
      </table>
    </>
  )
}
