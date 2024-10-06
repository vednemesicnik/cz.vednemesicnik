// noinspection JSUnusedGlobalSymbols

import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { Form, useLoaderData } from "@remix-run/react"
import type { ParamParseKey } from "@remix-run/router"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { getAuthorization } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/editorial-board/members/edit/:id">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Redakce - Upravit člena" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { id } = params as RouteParams

  const editorialBoardMemberPromise = prisma.editorialBoardMember.findUnique({
    where: { id },
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

  const editorialBoardMemberPositionsPromise =
    prisma.editorialBoardPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    })

  const [editorialBoardMember, editorialBoardMemberPositions] =
    await Promise.all([
      editorialBoardMemberPromise,
      editorialBoardMemberPositionsPromise,
    ])

  if (editorialBoardMember === null)
    throw new Response(null, {
      status: 404,
      statusText: "Editorial board member not found",
    })

  return json({ editorialBoardMember, editorialBoardMemberPositions })
}

export default function AdministrationEditorialBoardMembersEdit() {
  const { editorialBoardMember, editorialBoardMemberPositions } =
    useLoaderData<typeof loader>()

  const id = editorialBoardMember.id
  const name = editorialBoardMember.name
  const positions = editorialBoardMember.positions.map(
    (position) => position.id
  )
  return (
    <>
      <h1>Upravit člena</h1>
      <Form method="post">
        <input type="hidden" name="id" defaultValue={id} />
        <label>
          Jméno
          <input type="text" name="name" defaultValue={name} />
        </label>
        <fieldset>
          <legend>Pozice</legend>
          {editorialBoardMemberPositions.map((position) => (
            <label key={position.id}>
              <input
                type="checkbox"
                name="positionIds"
                value={position.id}
                defaultChecked={positions.includes(position.id)}
              />
              {position.key}
            </label>
          ))}
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Upravit člena</Button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const positionIds = formData.getAll("positionIds") as string[]

  // TODO: Validate form data

  await prisma.editorialBoardMember.update({
    where: { id },
    data: {
      name,
      positions: {
        set: positionIds.map((positionId) => ({ id: positionId })),
      },
    },
  })

  return redirect("/administration/editorial-board/members")
}
