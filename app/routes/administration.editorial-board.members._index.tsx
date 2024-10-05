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
  return [{ title: "Vedneměsíčník | Administrace Redakce - Členové" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const editoiralBoardMembers = await prisma.editorialBoardMember.findMany({
    select: {
      id: true,
      name: true,
      positions: {
        select: {
          id: true,
          key: true,
        },
      },
    },
  })

  return json({ editoiralBoardMembers })
}

export default function AdministrationEditorialBoardMembers() {
  const data = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Členové</h1>
      <NavLink
        to={"/administration/editorial-board/members/add"}
        preventScrollReset={true}
      >
        Přidat člena
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Jméno</th>
            <th>Pozice</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {data.editoiralBoardMembers.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>
                {member.positions.map((position) => position.key).join(", ")}
              </td>
              <td>
                <NavLink
                  to={`/administration/editorial-board/members/edit/${member.id}`}
                >
                  Upravit
                </NavLink>
                <Form
                  method="post"
                  action={`/administration/editorial-board/members/delete/${member.id}`}
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
