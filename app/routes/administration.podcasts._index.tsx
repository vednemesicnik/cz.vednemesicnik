// noinspection JSUnusedGlobalSymbols

import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Podcastů" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const podcasts = await prisma.podcast.findMany({
    select: {
      id: true,
      title: true,
    },
  })

  return json({ podcasts })
}

export default function AdministrationPodcasts() {
  const { podcasts } = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Administrace Podcastů</h1>
      <NavLink
        to={`/administration/podcasts/add-podcast`}
        preventScrollReset={true}
      >
        Přidat podcast
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Akce</th>
          </tr>
        </thead>
        {podcasts.map((podcast) => (
          <tr key={podcast.id}>
            <td>
              <NavLink to={`/administration/podcasts/${podcast.id}`}>
                {podcast.title}
              </NavLink>
            </td>
            <td>
              <NavLink
                to={`/administration/podcasts/edit-podcast/${podcast.id}`}
              >
                Upravit
              </NavLink>
              <Form
                method="post"
                action={`/administration/podcasts/delete-podcast/${podcast.id}`}
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
