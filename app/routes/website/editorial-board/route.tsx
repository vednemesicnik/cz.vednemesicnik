// noinspection JSUnusedGlobalSymbols
import { Divider } from '~/components/divider'
import { Group } from '~/components/group'
import { GroupName } from '~/components/group-name'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import type { Route } from './+types/route'

const EMAIL_ADDRESS = 'redakce@vednemesicnik.cz'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Tak to je naše redakce</Headline>
        <Subheadline>Prosím, seznamte se. Je nás hodně.</Subheadline>
      </HeadlineGroup>

      {loaderData.editorialBoardMemberPositions.map((position) => {
        return (
          <Group key={position.id}>
            <GroupName>{position.pluralLabel}</GroupName>
            <Paragraph>
              {position.members.length === 0
                ? '...'
                : position.members.map((member) => member.fullName).join(', ')}
            </Paragraph>
          </Group>
        )
      })}

      <Divider variant={'primary'} />

      <Paragraph>Máte nějaký nápad nebo nám chcete něco sdělit?</Paragraph>
      <Paragraph>
        Napište nám na{' '}
        <MailHyperlink address={EMAIL_ADDRESS}>{EMAIL_ADDRESS}</MailHyperlink>.
      </Paragraph>
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
