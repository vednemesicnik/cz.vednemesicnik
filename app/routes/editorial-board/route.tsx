// noinspection JSUnusedGlobalSymbols
import { Suspense } from 'react'
import { Await } from 'react-router'
import { Divider } from '~/components/divider'
import { Heading } from '~/components/heading'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import type { EditorialBoardData } from '~/utils/editorial-board.server'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

const EMAIL_ADDRESS = 'redakce@vednemesicnik.cz'

function Board({ data }: { data: EditorialBoardData }) {
  // A position without members is still being filled in the sheet, not
  // something to show a reader (15a).
  const positions = data.positions.filter(
    (position) => position.members.length > 0,
  )

  return (
    <div className={styles.board}>
      {positions.map((position) => (
        <section key={`${position.order}-${position.label}`}>
          <Heading className={styles.positionHeading} level={2}>
            {position.label}
          </Heading>
          <Paragraph>{position.members.join(', ')}</Paragraph>
        </section>
      ))}
    </div>
  )
}

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { editorialBoard, refreshedEditorialBoard } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Tak to je naše redakce</Headline>
        <Subheadline>Prosím, seznamte se. Je nás hodně.</Subheadline>
      </HeadlineGroup>

      {/* The headline stays centred on a phone, the content starts at the
          left (15b). */}
      <div className={styles.content}>
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
          <MailHyperlink address={EMAIL_ADDRESS}>{EMAIL_ADDRESS}</MailHyperlink>
          .
        </Paragraph>
      </div>
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
