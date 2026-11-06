// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { LinkButton } from '~/components/link-button'
import { Page } from '~/components/page'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

/**
 * The result of a submission whose link went out (design 15e), the same for a known and
 * a new address, so it says nothing about either. It leads on into the website: whoever came from the leaflet may not know it yet.
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <Page>
      <HeadlineGroup className={styles.headlineGroup}>
        <Headline>Zkontrolujte e-mail</Headline>
      </HeadlineGroup>

      <div className={styles.content}>
        <p className={styles.lead}>
          Na {loaderData.email} jsme poslali odkaz platný 72 hodin. Otevřete ho
          a na následující stránce potvrďte přihlášku tlačítkem. O přijetí do
          redakce rozhodne šéfredakce.
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
