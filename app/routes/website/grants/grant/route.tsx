// noinspection JSUnusedGlobalSymbols

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { CbLogo } from '~/components/logos/cb-logo'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { grant } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>{grant.name}</Headline>
        <Subheadline>{grant.year}</Subheadline>
      </HeadlineGroup>

      <section className={styles.sponsorSection}>
        <p className={styles.sponsorLabel}>Spolufinancováno</p>
        <CbLogo className={styles.sponsorLogo} />
        <p className={styles.fundingStatement}>{grant.fundingStatement}</p>
      </section>

      {grant.description.map((paragraph, index) => (
        <Paragraph key={index}>{paragraph}</Paragraph>
      ))}
    </Page>
  )
}
