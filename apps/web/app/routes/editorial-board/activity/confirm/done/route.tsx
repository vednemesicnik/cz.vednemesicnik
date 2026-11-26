// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { LinkButton } from '~/components/link-button'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

const EDITORIAL_OFFICE_ADDRESS = 'redakce@vednemesicnik.cz'

/**
 * After the button (design 15j). Both confirmations only thank: whether the web shows
 * someone also depends on a role the page does not know. Leaving says what it does to the
 * web, which always holds, and the way back, since it may be a pause. Only the browser
 * that just answered gets here, and loading it again writes nothing.
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const isLeave = loaderData.action === 'leave'

  return (
    <Page>
      <HeadlineGroup className={styles.headlineGroup}>
        <Headline>
          {isLeave ? 'Děkujeme za spolupráci' : 'Díky, že jste s námi'}
        </Headline>
      </HeadlineGroup>

      <div className={styles.content}>
        <p className={styles.lead}>
          {isLeave ? (
            <>
              Díky za všechno, co jste pro Vedneměsíčník udělali. Na stránce
              Redakce už nebudete. Změna se může projevit se zpožděním. Pokud se
              budete chtít vrátit, napište na{' '}
              <MailHyperlink address={EDITORIAL_OFFICE_ADDRESS}>
                {EDITORIAL_OFFICE_ADDRESS}
              </MailHyperlink>
              .
            </>
          ) : (
            'Děkujeme za potvrzení.'
          )}
        </p>

        <LinkButton
          className={styles.articles}
          to={href('/articles')}
          variant={'outline'}
        >
          Číst články
        </LinkButton>
      </div>
    </Page>
  )
}
