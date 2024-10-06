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
  return [{ title: "Vedneměsíčník | Administrace Redakce - Pozice" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const editoiralBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
      },
    })

  return json({ editoiralBoardMemberPositions })
}

export default function AdministrationEditorialBoardMemberPositions() {
  const data = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Pozice</h1>
      <NavLink
        to={"/administration/editorial-board/positions/add"}
        preventScrollReset={true}
      >
        Přidat pozici
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Klíč</th>
            <th>Označení v množném čísle</th>
            <th>Pořadí</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {data.editoiralBoardMemberPositions.map((position) => (
            <tr key={position.id}>
              <td>{position.key}</td>
              <td>{position.pluralLabel}</td>
              <td>{position.order}</td>
              <td>
                <NavLink
                  to={`/administration/editorial-board/positions/edit/${position.id}`}
                >
                  Upravit
                </NavLink>
                <Form
                  method="post"
                  action={`/administration/editorial-board/positions/delete/${position.id}`}
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
        </tbody>
      </table>
    </>
  )
}
