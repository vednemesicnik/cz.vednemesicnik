import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { useNavigation } from 'react-router'

import { Button } from '~/components/button'
import { ButtonLink } from '~/components/button-link'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { Heading } from '~/components/heading'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { CircleCheckIcon } from '~/components/icons/circle-check-icon'
import { Link } from '~/components/link'
import { TextField } from '~/components/text-field'
import { useHydrated } from '~/utils/use-hydrated'

import type { VerificationNotice } from '../../_action'
import { getIntentPath } from '../../_intent'
import { verificationCodeSchema } from '../../_schema'
import { getStepPath } from '../../_step'
import styles from './_styles.module.css'

export type Verification =
  | { expiresAt: string; state: 'pending' }
  | { state: 'expired' }
  | { state: 'verified' }

type Props = {
  /** The address from the details, as typed. */
  email: string
  /** What the last code action said, shown above the form. */
  notice: VerificationNotice | undefined
  submissionResult: SubmissionResult<string[]> | undefined
  verification: Verification
}

/**
 * The signature step's first part (design 15k): the code from the e-mail, then
 * one line once the address is verified (15d). Wording from the copywriter
 * (zup07jj5).
 */
export const EmailVerification = ({
  email,
  notice,
  submissionResult,
  verification,
}: Props) => {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  const isSubmitting = navigation.formMethod !== undefined
  const noticeRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const [form, fields] = useForm({
    defaultNoValidate: isHydrated,
    id: 'membership-code',
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

  if (verification.state === 'verified') {
    return (
      <p className={styles.verified}>
        <CircleCheckIcon className={styles.verifiedIcon} />
        <span className={styles.verifiedText}>
          E-mail <span className={styles.value}>{email}</span> je ověřený.
        </span>
      </p>
    )
  }

  const isPending = verification.state === 'pending'
  const sendForm = (
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
  )

  return (
    <section aria-labelledby={'email-verification'} className={styles.part}>
      <Heading className={styles.heading} id={'email-verification'} level={2}>
        Ověřte e-mail
      </Heading>

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

      {isPending ? (
        <p className={styles.text}>
          Na <span className={styles.value}>{email}</span> jsme poslali
          ověřovací kód. Platí do {verification.expiresAt}.
        </p>
      ) : (
        <p className={styles.text}>
          Pro ověření adresy <span className={styles.value}>{email}</span> si
          pošlete nový kód.
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
            {...getInputProps(fields.code, { type: 'text' })}
            autoCapitalize={'characters'}
            autoComplete={'one-time-code'}
            autoCorrect={'off'}
            className={styles.codeField}
            errors={fields.code.errors}
            isRequiredMarkHidden
            label={'Ověřovací kód'}
            ref={codeRef}
            required
            spellCheck={false}
          />
        </Form>
      )}

      <div className={styles.actions}>
        {isPending ? (
          <>
            <Button
              className={styles.primary}
              disabled={isSubmitting}
              form={form.id}
              type={'submit'}
            >
              Ověřit
            </Button>
            {sendForm}
          </>
        ) : (
          sendForm
        )}
        <Link className={styles.link} to={getStepPath('details')}>
          Opravit e-mail
        </Link>
      </div>

      {isPending && (
        <p className={styles.replaces}>Nový kód nahradí předchozí.</p>
      )}
    </section>
  )
}
