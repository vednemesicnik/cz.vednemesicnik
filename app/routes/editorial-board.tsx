// noinspection JSUnusedGlobalSymbols

import { json, type MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Contact } from "~/components/contact"
import { Divider } from "~/components/divider"
import { Group } from "~/components/group"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"
import { prisma } from "~/utils/db.server"

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
      <Headline>Tak to je naše redakce</Headline>
      <Paragraph>Prosím, seznamte se. Je nás hodně.</Paragraph>

      {data.editorialBoardMemberPositions.map((position) => {
        return (
          <Group key={position.id} label={position.label}>
            <Paragraph>
              {position.members.length === 0 ? "..." : position.members.map((member) => member.name).join(", ")}
            </Paragraph>
          </Group>
        )
      })}

      <Divider />

      <Contact label={"kontakt"} email={"redakce@vednemesicnik.cz"} />
    </Page>
  )
}
