// noinspection JSUnusedGlobalSymbols
import { Suspense } from 'react'
import { Await } from 'react-router'
import { Divider } from '~/components/divider'
import { Group } from '~/components/group'
import { GroupName } from '~/components/group-name'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import type { EditorialBoardData } from '~/utils/editorial-board.server'
import type { Route } from './+types/route'

const EMAIL_ADDRESS = 'redakce@vednemesicnik.cz'

function Board({ data }: { data: EditorialBoardData }) {
  return data.positions.map((position) => {
    return (
      <Group key={`${position.order}-${position.label}`}>
        <GroupName>{position.label}</GroupName>
        <Paragraph>
          {position.members.length === 0 ? '...' : position.members.join(', ')}
        </Paragraph>
      </Group>
    )
  })
}

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { editorialBoard, refreshedEditorialBoard } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Tak to je naše redakce</Headline>
        <Subheadline>Prosím, seznamte se. Je nás hodně.</Subheadline>
      </HeadlineGroup>

      {editorialBoard === null ? (
        <Paragraph>
          Seznam redakce se teď nepodařilo načíst. Zkuste to prosím později.
        </Paragraph>
      ) : refreshedEditorialBoard === null ? (
        <Board data={editorialBoard} />
      ) : (
        // Render stale data instantly; swap to the streamed fresh data when it
        // arrives. A failed refresh resolves to `null` → keep the stale render.
        <Suspense fallback={<Board data={editorialBoard} />}>
          <Await resolve={refreshedEditorialBoard}>
            {(fresh) => <Board data={fresh ?? editorialBoard} />}
          </Await>
        </Suspense>
      )}

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
