import { useLoaderData } from "@remix-run/react"

import { Contact } from "~/components/contact"
import { Divider } from "~/components/divider"
import { Group } from "~/components/group"
import { Headline } from "~/components/headline"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"

import { type loader } from "./_loader"

export default function Route() {
  const data = useLoaderData<typeof loader>()

  return (
    <Page>
      <Headline>Tak to je naše redakce</Headline>
      <Paragraph>Prosím, seznamte se. Je nás hodně.</Paragraph>

      {data.editorialBoardMemberPositions.map((position) => {
        return (
          <Group key={position.id} label={position.pluralLabel}>
            <Paragraph>
              {position.members.length === 0
                ? "..."
                : position.members.map((member) => member.fullName).join(", ")}
            </Paragraph>
          </Group>
        )
      })}

      <Divider variant={"secondary"} />

      <Contact label={"kontakt"} email={"redakce@vednemesicnik.cz"} />
    </Page>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"