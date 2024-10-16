import { Form, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Administrace Podcastu {loaderData.podcast.title}</h1>
      <NavLink
        to={`/administration/podcasts/${loaderData.podcast.id}/add-episode`}
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
        {loaderData.podcast.episodes.map((episode) => (
          <tr key={episode.id}>
            <td>
              <NavLink
                to={`/administration/podcasts/${loaderData.podcast.id}/${episode.id}`}
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
                to={`/administration/podcasts/${loaderData.podcast.id}/edit-episode/${episode.id}`}
              >
                Upravit
              </NavLink>
              <Form method="post" preventScrollReset={true}>
                <input type="hidden" name="id" value={episode.id} />
                <AuthenticityTokenInput />
                <Button
                  type="submit"
                  variant={"danger"}
                  name={formConfig.intent.name}
                  value={formConfig.intent.value.delete}
                >
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

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
