// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"

import { prisma } from "~/utils/db.server"

import { Page } from "~/components/page"
import { PageHeading } from "app/components/page-heading"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Redakce" }]
}

export const loader = async () => {
  // get editorial board member positions where name is chief-editor, editor and advisor
  const editorialBoardMemberPositions = await prisma.editorialBoardMemberPosition.findMany({
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      label: true,
      members: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return json({ editorialBoardMemberPositions })
}

export default function EditorialBoard() {
  const data = useLoaderData<typeof loader>()

  return (
    <Page>
      <PageHeading>Redakce</PageHeading>
      <h1>Tak to je naše redakce</h1>
      <p>Prosím, seznamte se. Je nás hodně.</p>

      {data.editorialBoardMemberPositions.map((position) => {
        return (
          <p key={position.id}>
            <strong>{position.label}:</strong>
            <br />
            {position.members.length === 0 ? "..." : position.members.map((member) => member.name).join(", ")}
          </p>
        )
      })}

      <p>
        <strong>kontakt:</strong>
        <br />
        <a href="mailto:redakce@vednemesicnik.cz">redakce@vednemesicnik.cz</a>
      </p>
    </Page>
  )
}
