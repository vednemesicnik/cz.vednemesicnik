import { Form, Link, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"
import { routesConfig } from "~/config/routes-config"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const addArchivedIssuePath =
    routesConfig.administration.archive.addArchivedIssue.staticPath

  return (
    <>
      <h1>Administrace Archivu</h1>
      <NavLink to={addArchivedIssuePath} preventScrollReset={true}>
        Přidat výtisk
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Zveřejněno</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.archivedIssues.map((issue) => {
            const editArchivedIssuePath =
              routesConfig.administration.archive.editArchivedIssue.getStaticPath(
                issue.id
              )

            return (
              <tr key={issue.id}>
                <td>{issue.label}</td>
                <td>{issue.published ? "🟢" : "🔴"}</td>
                <td>
                  <Link to={editArchivedIssuePath}>Upravit</Link>
                  <Form method="post" preventScrollReset={true}>
                    <AuthenticityTokenInput />
                    <input type="hidden" name={"id"} value={issue.id} />
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
            )
          })}
        </tbody>
      </table>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
