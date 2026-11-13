// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { Headline } from '~/components/headline'
import { CheckIcon } from '~/components/icons/check-icon'
import { LinkButton } from '~/components/link-button'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { HeadlineIcon } from './components/headline-icon'
import { RequestIdBadge } from './components/request-id-badge'

export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

const DONATIONS_ADDRESS = 'dary@vednemesicnik.cz'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { requestId, year } = loaderData

  return (
    <Page>
      <div className={styles.sent}>
        <HeadlineIcon>
          <CheckIcon />
        </HeadlineIcon>
        <Headline className={styles.heading}>Děkujeme za vaši žádost</Headline>
        <p className={styles.lead}>
          Žádost o potvrzení o daru za rok {year} jsme přijali. Potvrzení
          pošleme na e-mail uvedený v žádosti.
        </p>

        <RequestIdBadge value={requestId} />

        <p className={styles.note}>
          Prosíme o trpělivost při vyřizování žádosti. Pokud potvrzení nepřijde
          do dvou týdnů, napište na{' '}
          <MailHyperlink address={DONATIONS_ADDRESS}>
            {DONATIONS_ADDRESS}
          </MailHyperlink>{' '}
          a uveďte kód žádosti.
        </p>

        <LinkButton
          className={styles.backButton}
          to={href('/donate')}
          variant="outline"
        >
          Zpět na darování
        </LinkButton>
      </div>
    </Page>
  )
}
