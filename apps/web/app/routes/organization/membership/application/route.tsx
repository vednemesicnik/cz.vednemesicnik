// noinspection JSUnusedGlobalSymbols

import type { ShouldRevalidateFunction } from 'react-router'

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { Page } from '~/components/page'
import { Stepper } from '~/components/stepper'
import { StepperStep } from '~/components/stepper-step'

import { getStepPath } from './_step'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { DetailsStep } from './components/details-step'
import { SentStep } from './components/sent-step'
import { SignatureStep } from './components/signature-step'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

// React Router skips the loaders after an action answers 400 or above. Here the
// answer often changes what the step shows — a refused submit or an expired code
// takes the upload away (15k) — so the step always reloads after a POST.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionStatus,
  defaultShouldRevalidate,
}) => actionStatus !== undefined || defaultShouldRevalidate

export default function RouteComponent({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  // A form's result, or a sentence for the code part of the signature step.
  const submissionResult =
    actionData !== undefined && 'submissionResult' in actionData
      ? actionData.submissionResult
      : undefined
  const notice =
    actionData !== undefined && 'notice' in actionData
      ? actionData.notice
      : undefined

  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <Page>
        <HeadlineGroup className={styles.headlineGroup}>
          <Headline>
            {loaderData.step === 'sent'
              ? 'Přihlášku máme'
              : 'Přihláška do spolku'}
          </Headline>
        </HeadlineGroup>

        {/* `sent` is no step (15d). */}
        {loaderData.step !== 'sent' && (
          <Stepper className={styles.stepper} label={'Kroky přihlášky'}>
            {loaderData.step === 'details' ? (
              <StepperStep state={'current'}>Údaje</StepperStep>
            ) : (
              <StepperStep state={'done'} to={getStepPath('details')}>
                Údaje
              </StepperStep>
            )}
            <StepperStep
              state={loaderData.step === 'signature' ? 'current' : 'upcoming'}
            >
              Podpis a odeslání
            </StepperStep>
          </Stepper>
        )}

        {loaderData.step === 'details' && (
          <DetailsStep
            details={loaderData.details}
            isExpired={loaderData.isExpired}
            submissionResult={submissionResult}
          />
        )}
        {loaderData.step === 'signature' && (
          <SignatureStep
            email={loaderData.email}
            isMinor={loaderData.isMinor}
            notice={notice}
            submissionResult={submissionResult}
            verification={loaderData.verification}
          />
        )}
        {loaderData.step === 'sent' && (
          <SentStep code={loaderData.code} email={loaderData.email} />
        )}
      </Page>
    </HoneypotProvider>
  )
}
