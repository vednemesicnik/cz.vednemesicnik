import { Form, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

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
        {loaderData.podcasts.map((podcast) => (
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
              <Form method="post" preventScrollReset={true}>
                <input type="hidden" name="id" value={podcast.id} />
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
