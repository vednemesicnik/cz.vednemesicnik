import { Form, NavLink, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Pozice</h1>
      <NavLink
        to={"/administration/editorial-board/positions/add-position"}
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
          {loaderData.editoiralBoardMemberPositions.map((position) => (
            <tr key={position.id}>
              <td>{position.key}</td>
              <td>{position.pluralLabel}</td>
              <td>{position.order}</td>
              <td>
                <NavLink
                  to={`/administration/editorial-board/positions/edit-position/${position.id}`}
                >
                  Upravit
                </NavLink>
                <Form method="post" preventScrollReset={true}>
                  <input type="hidden" name="id" value={position.id} />
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
