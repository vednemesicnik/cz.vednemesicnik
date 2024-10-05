// noinspection JSUnusedGlobalSymbols

import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form, Link, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { routesConfig } from "~/config/routes-config"
import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Archivu" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const archivedIssues = await prisma.archivedIssue.findMany({
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      id: true,
      label: true,
      published: true,
      // NOTE: Maybe cover and pdf should be selected only if needed
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
      pdf: {
        select: {
          id: true,
        },
      },
    },
  })

  return json({ archivedIssues })
}

export default function AdministrationArchive() {
  const data = useLoaderData<typeof loader>()

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
          {data.archivedIssues.map((issue) => {
            const editArchivedIssuePath =
              routesConfig.administration.archive.editArchivedIssue.getStaticPath(
                issue.id
              )
            const deleteArchivedIssuePath =
              routesConfig.administration.archive.deleteArchivedIssue.getStaticPath(
                issue.id
              )

            return (
              <tr key={issue.id}>
                <td>{issue.label}</td>
                <td>{issue.published ? "🟢" : "🔴"}</td>
                <td>
                  <Link to={editArchivedIssuePath}>Upravit</Link>
                  <Form
                    method="post"
                    action={deleteArchivedIssuePath}
                    preventScrollReset={true}
                  >
                    <AuthenticityTokenInput />
                    <Button type="submit" variant={"danger"}>
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
