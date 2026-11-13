// noinspection JSUnusedGlobalSymbols

import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import {
  Form,
  type ShouldRevalidateFunction,
  useNavigation,
} from 'react-router'

import { Button } from '~/components/button'
import { ButtonLink } from '~/components/button-link'
import { Callout } from '~/components/callout'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { CircleCheckIcon } from '~/components/icons/circle-check-icon'
import { Link } from '~/components/link'
import { Page } from '~/components/page'
import { Stepper } from '~/components/stepper'
import { StepperStep } from '~/components/stepper-step'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'
import { verificationCodeSchema } from '~/utils/email-verification/verification-code-schema'
import { useHydrated } from '~/utils/use-hydrated'

import { getStepPath } from '../_step'
import { getIntentPath } from './_intent'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

// React Router skips the loaders after an action answers 400 or above. Here the
// answer often changes what the step shows — an expired code, a confirmed
// address whose request did not go — so the step always reloads after a POST.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionStatus,
  defaultShouldRevalidate,
}) => actionStatus !== undefined || defaultShouldRevalidate

export default function RouteComponent({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { email, honeypotInputProps, verification, year } = loaderData
  const submissionResult =
    actionData !== undefined && 'submissionResult' in actionData
      ? actionData.submissionResult
      : undefined
  const notice =
    actionData !== undefined && 'notice' in actionData
      ? actionData.notice
      : undefined

  const isHydrated = useHydrated()
  const navigation = useNavigation()
  const isSubmitting = navigation.formMethod !== undefined
  const noticeRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const [form, fields] = useForm({
    defaultNoValidate: isHydrated,
    id: 'donation-code',
    lastResult: submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: verificationCodeSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  // An error goes where there is something to do; after a new code, the field.
  useEffect(() => {
    if (notice === undefined) return
    if (notice.tone === 'error') noticeRef.current?.focus()
    else codeRef.current?.focus()
  }, [notice])

  const isPending = verification.state === 'pending'

  return (
    <HoneypotProvider {...honeypotInputProps}>
      <Page>
        <HeadlineGroup className={styles.headlineGroup}>
          <Headline>Žádost o potvrzení o daru</Headline>
        </HeadlineGroup>

        <Stepper className={styles.stepper} label={'Kroky žádosti'}>
          <StepperStep state={'done'} to={getStepPath('details')}>
            Údaje
          </StepperStep>
          <StepperStep state={'current'}>Ověření a odeslání</StepperStep>
        </Stepper>

        <div className={styles.column}>
          {/* The counterpart of the sent page's sentence (15m). */}
          <p className={styles.status}>
            Žádost o potvrzení o daru za rok {year} zatím není odeslaná.
            {verification.state !== 'verified' &&
              ' Odešleme ji, až ověříte e-mail.'}
          </p>

          <section aria-label={'Ověření e-mailu'} className={styles.card}>
            {notice !== undefined && (
              <div className={styles.notice} ref={noticeRef} tabIndex={-1}>
                <Callout
                  role={notice.tone === 'error' ? 'alert' : 'status'}
                  tone={notice.tone}
                >
                  {notice.message}
                </Callout>
              </div>
            )}

            {verification.state === 'verified' ? (
              <>
                <p className={styles.verified}>
                  <CircleCheckIcon className={styles.verifiedIcon} />
                  <span>
                    E-mail <span className={styles.value}>{email}</span> je
                    ověřený.
                  </span>
                </p>
                <div className={styles.actions}>
                  <Form
                    action={getIntentPath('submit')}
                    className={styles.sendForm}
                    method={'post'}
                  >
                    <HoneypotInputs />
                    <Button
                      className={styles.primary}
                      disabled={isSubmitting}
                      type={'submit'}
                    >
                      Odeslat žádost
                    </Button>
                  </Form>
                  <Link className={styles.link} to={getStepPath('details')}>
                    Opravit údaje
                  </Link>
                </div>
              </>
            ) : (
              <>
                {isPending ? (
                  <p className={styles.text}>
                    Na <span className={styles.value}>{email}</span> jsme
                    poslali ověřovací kód. Platí do {verification.expiresAt}.
                  </p>
                ) : (
                  <p className={styles.text}>
                    Pro ověření adresy{' '}
                    <span className={styles.value}>{email}</span> si pošlete
                    nový kód.
                  </p>
                )}

                {isPending && (
                  <Form
                    {...getFormProps(form)}
                    action={getIntentPath('verify-code')}
                    method={'post'}
                  >
                    <HoneypotInputs />
                    <TextField
                      className={styles.codeField}
                      errors={fields.code.errors}
                      id={fields.code.id}
                      required
                    >
                      <TextFieldLabel isRequiredMarkHidden>
                        Ověřovací kód
                      </TextFieldLabel>
                      <TextFieldControl
                        {...getInputProps(fields.code, { type: 'text' })}
                        autoCapitalize={'characters'}
                        autoComplete={'one-time-code'}
                        autoCorrect={'off'}
                        ref={codeRef}
                        spellCheck={false}
                      />
                    </TextField>
                  </Form>
                )}

                <div className={styles.actions}>
                  {isPending && (
                    <Button
                      className={styles.primary}
                      disabled={isSubmitting}
                      form={form.id}
                      type={'submit'}
                    >
                      Ověřit a odeslat žádost
                    </Button>
                  )}
                  <Form
                    action={getIntentPath('send-code')}
                    className={styles.sendForm}
                    method={'post'}
                  >
                    <HoneypotInputs />
                    {isPending ? (
                      <ButtonLink
                        className={styles.link}
                        disabled={isSubmitting}
                        type={'submit'}
                      >
                        Poslat znovu
                      </ButtonLink>
                    ) : (
                      <Button
                        className={styles.primary}
                        disabled={isSubmitting}
                        type={'submit'}
                      >
                        Poslat nový kód
                      </Button>
                    )}
                  </Form>
                  <Link className={styles.link} to={getStepPath('details')}>
                    Opravit údaje
                  </Link>
                </div>

                {isPending && notice === undefined && (
                  <p className={styles.replaces}>Nový kód nahradí předchozí.</p>
                )}
              </>
            )}
          </section>
        </div>
      </Page>
    </HoneypotProvider>
  )
}
