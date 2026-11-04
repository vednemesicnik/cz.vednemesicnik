// noinspection JSUnusedGlobalSymbols

import type { ShouldRevalidateFunction } from 'react-router'

import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { Page } from '~/components/page'
import { Subheadline } from '~/components/subheadline'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EnrolmentForm } from './components/enrolment-form'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

// A refused token: the loader issues a new one, so the second press goes through.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionStatus,
  defaultShouldRevalidate,
}) => actionStatus === 403 || defaultShouldRevalidate

export default function RouteComponent({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <AuthenticityTokenProvider token={loaderData.csrfToken}>
        <Page>
          <HeadlineGroup className={styles.headlineGroup}>
            <Headline>Přidejte se k redakci</Headline>
            <Subheadline>
              Chcete s námi dělat časopis? Nechte nám na sebe kontakt.
            </Subheadline>
          </HeadlineGroup>

          <EnrolmentForm submissionResult={actionData?.submissionResult} />
        </Page>
      </AuthenticityTokenProvider>
    </HoneypotProvider>
  )
}
