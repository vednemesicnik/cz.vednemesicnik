import { Form, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Členové</h1>
      <NavLink
        to={"/administration/editorial-board/members/add-member"}
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
          {loaderData.editoiralBoardMembers.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>
                {member.positions.map((position) => position.key).join(", ")}
              </td>
              <td>
                <NavLink
                  to={`/administration/editorial-board/members/edit-member/${member.id}`}
                >
                  Upravit
                </NavLink>
                <Form method="post" preventScrollReset={true}>
                  <input type="hidden" name="id" value={member.id} />
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
