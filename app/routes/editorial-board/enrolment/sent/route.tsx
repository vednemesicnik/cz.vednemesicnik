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
 * The result of every submission (design 15e), so it says nothing about the address.
 * It leads on into the website: whoever came from the leaflet may not know it yet.
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <Page>
      <HeadlineGroup className={styles.headlineGroup}>
        <Headline>Zkontrolujte e-mail</Headline>
      </HeadlineGroup>

      <div className={styles.content}>
        <p className={styles.lead}>
          Na {loaderData.email} jsme poslali odkaz platný 72 hodin. Přes odkaz
          přejděte na stránku a potvrďte přihlášku tlačítkem. O přijetí do
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
