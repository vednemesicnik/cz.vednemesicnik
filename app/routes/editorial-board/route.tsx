import { useLoaderData } from "@remix-run/react"

import { Divider } from "~/components/divider"
import { Group } from "~/components/group"
import { Headline } from "~/components/headline"
import { MailHyperlink } from "~/components/mail-hyperlink"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"

import { type loader } from "./_loader"

const EMAIL_ADDRESS = "redakce@vednemesicnik.cz"

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

      <Paragraph>Máte nějaký nápad nebo nám chcete něco sdělit?</Paragraph>
      <Paragraph>
        Napište nám na{" "}
        <MailHyperlink to={EMAIL_ADDRESS}>{EMAIL_ADDRESS}</MailHyperlink>.
      </Paragraph>
    </Page>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
