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
  return [{ title: "Vedneměsíčník | Administrace Redakce - Přidat pozici" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const editorialBoardPositionCount =
    await prisma.editorialBoardPosition.count()

  return json({ editorialBoardPositionCount })
}

export default function AdministrationEditorialBoardPositionsAdd() {
  const data = useLoaderData<typeof loader>()

  return (
    <>
      <h1>Přidat pozici</h1>
      <Form method="post">
        <label>
          Unikátní klíč
          <input type="text" name="key" />
        </label>
        <label>
          Označení v množném čísle
          <input type="text" name="pluralLabel" />
        </label>
        <label>
          Pořadí
          <input
            type="number"
            name="order"
            min={1}
            max={data.editorialBoardPositionCount + 1}
          />
        </label>
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Přidat pozici</Button>
      </Form>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const key = formData.get("key") as string
  const pluralLabel = formData.get("pluralLabel") as string
  const order = Number(formData.get("order")) as number

  // TODO: Validate form data

  await prisma.$transaction(async (prisma) => {
    // Update the orders of existing positions
    const positions = await prisma.editorialBoardPosition.findMany({
      where: {
        order: {
          gte: order,
        },
      },
      orderBy: {
        order: "desc",
      },
    })

    for (const position of positions) {
      await prisma.editorialBoardPosition.update({
        where: { id: position.id },
        data: { order: position.order + 1 },
      })
    }

    // Create the new position
    await prisma.editorialBoardPosition.create({
      data: {
        key,
        pluralLabel,
        order,
        author: {
          connect: { username: "owner" },
        },
      },
    })
  })

  return redirect("/administration/editorial-board/positions")
}
