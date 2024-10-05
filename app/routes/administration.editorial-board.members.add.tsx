// noinspection JSUnusedGlobalSymbols

import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { getAuthorization } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Redakce - Přidat člena" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const editorialBoardMemberPositions =
    await prisma.editorialBoardMemberPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    })

  return json({ editorialBoardMemberPositions })
}

export default function AdministrationEditorialBoardMembersAdd() {
  const data = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Přidat člena</h1>
      <Form method="post">
        <label>
          Jméno
          <input type="text" name="name" />
        </label>
        <fieldset>
          <legend>Pozice</legend>
          {data.editorialBoardMemberPositions.map((position) => (
            <label key={position.id}>
              <input type="checkbox" name="positionIds" value={position.id} />
              {position.key}
            </label>
          ))}
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Přidat člena</Button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const name = formData.get("name") as string
  const positionIds = formData.getAll("positionIds") as string[]

  // TODO: Validate form data

  await prisma.editorialBoardMember.create({
    data: {
      name,
      positions: {
        connect: positionIds.map((positionId) => ({ id: positionId })),
      },
      author: {
        connect: { username: "owner" },
      },
    },
  })

  return redirect("/administration/editorial-board/members")
}
