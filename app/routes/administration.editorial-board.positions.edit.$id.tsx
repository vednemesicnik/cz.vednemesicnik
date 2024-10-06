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
  ParamParseKey<"administration/editorial-board/positions/edit/:id">,
  string
>

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Redakce - Upravit pozici" }]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { id } = params as RouteParams

  const editorialBoardPositionsCountPromise =
    prisma.editorialBoardPosition.count()

  const editorialBoardPositionPromise =
    prisma.editorialBoardPosition.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
      },
    })

  const [editorialBoardPositionsCount, editorialBoardPosition] =
    await Promise.all([
      editorialBoardPositionsCountPromise,
      editorialBoardPositionPromise,
    ])

  if (editorialBoardPosition === null) {
    throw new Response(null, {
      status: 404,
      statusText: "Editorial board position not found",
    })
  }

  return json({ editorialBoardPositionsCount, editorialBoardPosition })
}

export default function AdministrationEditorialBoardPositionsEdit() {
  const { editorialBoardPosition, editorialBoardPositionsCount } =
    useLoaderData<typeof loader>()

  return (
    <>
      <h1>Upravit pozici</h1>
      <Form method="post">
        <input type="hidden" name="id" value={editorialBoardPosition.id} />
        <input
          type="hidden"
          name="currentOrder"
          value={editorialBoardPosition.order}
        />
        <label>
          Unikátní klíč
          <input
            type="text"
            name="key"
            defaultValue={editorialBoardPosition.key}
          />
        </label>
        <label>
          Označení v množném čísle
          <input
            type="text"
            name="pluralLabel"
            defaultValue={editorialBoardPosition.pluralLabel}
          />
        </label>
        <label>
          Pořadí
          <input
            type="number"
            name="newOrder"
            min={1}
            max={editorialBoardPositionsCount}
            defaultValue={editorialBoardPosition.order}
          />
        </label>
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Upravit pozici</Button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const id = formData.get("id") as string
  const key = formData.get("key") as string
  const pluralLabel = formData.get("pluralLabel") as string
  const newOrder = Number(formData.get("newOrder")) as number
  const currentOrder = Number(formData.get("currentOrder")) as number

  // TODO: Validate form data

  await prisma.$transaction(async (prisma) => {
    // Set the target position's order to a temporary value
    await prisma.editorialBoardPosition.update({
      where: { id },
      data: { order: 0 },
    })

    // Adjust the orders of other positions
    if (newOrder > currentOrder) {
      // Decrease the order of positions between currentOrder and newOrder
      const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
        where: {
          order: {
            gt: currentOrder,
            lte: newOrder,
          },
        },
        orderBy: {
          order: "asc",
        },
      })

      for (const position of positionsToUpdate) {
        await prisma.editorialBoardPosition.update({
          where: { id: position.id },
          data: { order: position.order - 1 },
        })
      }
    }

    if (newOrder < currentOrder) {
      // Increase the order of positions between newOrder and currentOrder
      const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
        where: {
          order: {
            gte: newOrder,
            lt: currentOrder,
          },
        },
        orderBy: {
          order: "desc",
        },
      })

      for (const position of positionsToUpdate) {
        await prisma.editorialBoardPosition.update({
          where: { id: position.id },
          data: { order: position.order + 1 },
        })
      }
    }

    // Update the order of the target position to the new order
    await prisma.editorialBoardPosition.update({
      where: { id },
      data: { order: newOrder, key, pluralLabel },
    })
  })

  return redirect("/administration/editorial-board/positions")
}
