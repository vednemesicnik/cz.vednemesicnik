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
  ParamParseKey<"administration/podcasts/:podcastId">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Podcastu" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { podcastId } = params as RouteParams

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      episodes: {
        select: {
          id: true,
          title: true,
          publishedAt: true,
          published: true,
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  })

  return json({ podcast })
}

export default function PodcastAdministration() {
  const { podcast } = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Administrace Podcastu {podcast.title}</h1>
      <NavLink
        to={`/administration/podcasts/${podcast.id}/add-episode`}
        preventScrollReset={true}
      >
        Přidat epizodu
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Publikováno</th>
            <th>Publikováno dne</th>
            <th>Akce</th>
          </tr>
        </thead>
        {podcast.episodes.map((episode) => (
          <tr key={episode.id}>
            <td>
              <NavLink
                to={`/administration/podcasts/${podcast.id}/${episode.id}`}
              >
                {episode.title}
              </NavLink>
            </td>
            <td>{episode.published ? "🟢" : "🔴"}</td>
            <td>
              {episode.publishedAt
                ? new Date(episode.publishedAt).toLocaleDateString("cs-CZ")
                : "Nepublikováno"}
            </td>
            <td>
              <NavLink
                to={`/administration/podcasts/${podcast.id}/edit-episode/${episode.id}`}
              >
                Upravit
              </NavLink>
              <Form
                method="post"
                action={`/administration/podcasts/${podcast.id}/delete-episode/${episode.id}`}
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
