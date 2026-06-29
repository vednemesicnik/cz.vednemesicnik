// noinspection JSUnusedGlobalSymbols

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { CheckIcon } from '~/components/icons/check-icon'
import { LinkButton } from '~/components/link-button'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { HeadlineIcon } from './components/headline-icon'
import { RequestIdBadge } from './components/request-id-badge'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { requestId, year } = loaderData

  return (
    <Page>
      <HeadlineGroup className={styles.headlineGroup}>
        <HeadlineIcon>
          <CheckIcon />
        </HeadlineIcon>
        <Headline className={styles.heading}>Děkujeme za Vaši žádost</Headline>
        <Subheadline className={styles.subheadline}>
          Vaše žádost o potvrzení o daru za rok {year} byla přijata. Potvrzení
          připravíme a zašleme na e-mailovou adresu uvedenou v žádosti.
        </Subheadline>
      </HeadlineGroup>

      {requestId && <RequestIdBadge value={requestId} />}

      <Paragraph className={styles.note}>
        Pokud potvrzení neobdržíte do několika pracovních dnů, napište nám na{' '}
        <MailHyperlink address="dary@vednemesicnik.cz">
          dary@vednemesicnik.cz
        </MailHyperlink>
        {requestId && ' a uveďte referenční kód žádosti'}.
      </Paragraph>

      <LinkButton
        className={styles.backButton}
        size="lg"
        to="/donate"
        variant="filled"
      >
        Zpět na darování
      </LinkButton>
    </Page>
  )
}
