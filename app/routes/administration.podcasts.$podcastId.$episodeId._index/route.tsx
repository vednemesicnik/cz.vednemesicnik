import { Form, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"
import { type loader } from "~/routes/administration.podcasts.$podcastId.$episodeId._index/loader"

export default function Route() {
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
        <tbody>
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
                <Form method="post" preventScrollReset={true}>
                  <input type="hidden" name="id" value={link.id} />
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
        </tbody>
      </table>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
