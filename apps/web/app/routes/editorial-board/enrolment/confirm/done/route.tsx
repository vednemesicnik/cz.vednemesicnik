// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { LinkButton } from '~/components/link-button'
import { Page } from '~/components/page'

import styles from './_styles.module.css'

export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

/**
 * After the button (design 15e-confirm): a thank-you, because a plain welcome would read
 * as being accepted, and the chief editors decide that. Only the browser that just
 * confirmed gets here, and loading it again writes nothing.
 */
export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup className={styles.headlineGroup}>
        <Headline>Děkujeme za zájem!</Headline>
      </HeadlineGroup>

      <div className={styles.content}>
        <p className={styles.lead}>
          Přihláška je potvrzená. Jsme rádi, že chcete dělat Vedneměsíčník s
          námi. O přijetí do redakce rozhodne šéfredakce.
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
