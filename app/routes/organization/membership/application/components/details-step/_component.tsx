import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { href, useNavigation } from 'react-router'

import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { FormLegend } from '~/components/form-legend'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Hyperlink } from '~/components/hyperlink'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldHint } from '~/components/text-field-hint'
import { TextFieldLabel } from '~/components/text-field-label'
import { useHydrated } from '~/utils/use-hydrated'

import { detailsSchema } from '../../_schema'
import styles from './_styles.module.css'

type Props = {
  /** What the cookie holds, for someone who came back to change it. */
  details: Record<string, string> | null
  /** They came straight to the next step and the details are gone. */
  isExpired: boolean
  submissionResult: SubmissionResult<string[]> | undefined
}

/** The first step (design 15d): only the phone is optional. */
export const DetailsStep = ({
  details,
  isExpired,
  submissionResult,
}: Props) => {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  // Set only by a submission, redirect included; a link leaves it undefined.
  const isSubmitting = navigation.formMethod !== undefined
  const formErrorRef = useRef<HTMLDivElement>(null)

  // `required` by hand: a `constraint` would add `maxLength`, and the browser
  // would cut a long name off before the form could say so.
  const [form, fields] = useForm({
    defaultNoValidate: isHydrated,
    defaultValue: details,
    id: 'membership-details',
    lastResult: submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: detailsSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  const formError = form.errors?.[0]

  // The code did not go out: the message is the one thing to read (15k). Keyed
  // by the result, so a second failure with the same words moves focus again.
  useEffect(() => {
    if (submissionResult?.error?.['']?.length) formErrorRef.current?.focus()
  }, [submissionResult])

  return (
    <div className={styles.step}>
      {formError !== undefined ? (
        <div className={styles.formError} ref={formErrorRef} tabIndex={-1}>
          <Callout className={styles.callout} role={'alert'} tone={'error'}>
            {formError}
          </Callout>
        </div>
      ) : (
        isExpired && (
          <Callout className={styles.callout}>
            Vyplněné údaje už nejsou k dispozici. Vyplňte je prosím znovu.
          </Callout>
        )
      )}

      <Form {...getFormProps(form)} className={styles.form} method={'post'}>
        <HoneypotInputs />

        <FormLegend />

        <TextField
          errors={fields.firstName.errors}
          id={fields.firstName.id}
          required
        >
          <TextFieldLabel>Jméno</TextFieldLabel>
          <TextFieldControl
            autoComplete={'given-name'}
            {...getInputProps(fields.firstName, { type: 'text' })}
          />
        </TextField>
        <TextField
          errors={fields.lastName.errors}
          id={fields.lastName.id}
          required
        >
          <TextFieldLabel>Příjmení</TextFieldLabel>
          <TextFieldControl
            autoComplete={'family-name'}
            {...getInputProps(fields.lastName, { type: 'text' })}
          />
        </TextField>
        <TextField
          errors={fields.dateOfBirth.errors}
          id={fields.dateOfBirth.id}
          required
        >
          <TextFieldLabel>Datum narození</TextFieldLabel>
          <TextFieldControl
            placeholder={'14. 5. 2009'}
            {...getInputProps(fields.dateOfBirth, { type: 'text' })}
          />
          <TextFieldHint>
            Mladším 18 let podepíše prohlášení i zákonný zástupce.
          </TextFieldHint>
        </TextField>
        <TextField
          errors={fields.address.errors}
          id={fields.address.id}
          required
        >
          <TextFieldLabel>Adresa trvalého bydliště</TextFieldLabel>
          <TextFieldControl
            autoComplete={'street-address'}
            {...getInputProps(fields.address, { type: 'text' })}
          />
        </TextField>
        <TextField errors={fields.email.errors} id={fields.email.id} required>
          <TextFieldLabel>E-mail</TextFieldLabel>
          <TextFieldControl
            autoComplete={'email'}
            {...getInputProps(fields.email, { type: 'email' })}
          />
          <TextFieldHint>E-mail ověříte kódem.</TextFieldHint>
        </TextField>
        <TextField
          errors={fields.phone.errors}
          id={fields.phone.id}
          required={fields.phone.required}
        >
          <TextFieldLabel optional>Telefon</TextFieldLabel>
          <TextFieldControl
            autoComplete={'tel'}
            {...getInputProps(fields.phone, { type: 'tel' })}
          />
        </TextField>

        <div className={styles.notes}>
          <p className={styles.note}>
            V dalším kroku podepíšete přihlášku. Podpisem potvrdíte, že
            splňujete podmínky členství, znáte{' '}
            <Hyperlink href={href('/organization/membership/statutes.pdf')}>
              stanovy spolku
            </Hyperlink>{' '}
            a souhlasíte s nimi.
          </p>
          <p className={styles.note}>
            Do odeslání zůstávají údaje jen ve vašem prohlížeči, nejdéle 30 dní.
          </p>
        </div>

        <Button
          className={styles.submit}
          disabled={isSubmitting}
          type={'submit'}
        >
          Pokračovat
        </Button>
      </Form>
    </div>
  )
}
