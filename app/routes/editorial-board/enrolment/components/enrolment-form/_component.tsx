import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useNavigation } from 'react-router'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { FormLegend } from '~/components/form-legend'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { TextField } from '~/components/text-field'
import { TextareaField } from '~/components/textarea-field'
import { ORGANIZATION_REGISTRATION_NUMBER } from '~/config/site-config'
import { useHydrated } from '~/utils/use-hydrated'

import { enrolmentSchema } from '../../_schema'
import styles from './_styles.module.css'

type Props = {
  submissionResult: SubmissionResult<string[]> | undefined
}

/**
 * The form from the leaflet (design 15e): filled in on a phone during the meeting, so
 * the keyboards and autofill do the typing. Submitting is the act: the paragraph above
 * the button says what it confirms, and nothing is ticked.
 */
export const EnrolmentForm = ({ submissionResult }: Props) => {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  // Set only by a submission, redirect included; a link leaves it undefined.
  const isSubmitting = navigation.formMethod !== undefined

  // `required` by hand: a `constraint` would add `maxLength`, and the browser
  // would cut a long name off before the form could say so.
  const [form, fields] = useForm({
    defaultNoValidate: isHydrated,
    id: 'editorial-board-enrolment',
    lastResult: submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: enrolmentSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  return (
    <div className={styles.container}>
      {form.errors !== undefined && form.errors.length > 0 && (
        <Callout className={styles.callout} role={'alert'} tone={'error'}>
          {form.errors[0]}
        </Callout>
      )}

      <Form {...getFormProps(form)} className={styles.form} method={'post'}>
        <HoneypotInputs />
        <AuthenticityTokenInput />

        <FormLegend />

        <TextField
          autoComplete={'given-name'}
          errors={fields.firstName.errors}
          label={'Jméno'}
          required
          {...getInputProps(fields.firstName, { type: 'text' })}
        />
        <TextField
          autoComplete={'family-name'}
          errors={fields.lastName.errors}
          label={'Příjmení'}
          required
          {...getInputProps(fields.lastName, { type: 'text' })}
        />
        <TextField
          autoComplete={'email'}
          errors={fields.email.errors}
          label={'E-mail'}
          required
          {...getInputProps(fields.email, { type: 'email' })}
        />
        <TextField
          autoComplete={'tel'}
          errors={fields.phone.errors}
          label={'Telefon'}
          optional
          {...getInputProps(fields.phone, { type: 'tel' })}
        />
        <TextareaField
          field={fields.interest}
          label={'Čemu byste se chtěli věnovat?'}
          optional
          textareaProps={{
            placeholder: 'psaní, focení, korektury…',
            rows: 3,
          }}
        />

        <p className={styles.notice}>
          Odesláním potvrzujete, že vám je alespoň 15 let, a berete na vědomí,
          že spolek Vedneměsíčník,&nbsp;z.&nbsp;s., IČO&nbsp;
          {ORGANIZATION_REGISTRATION_NUMBER}, použije vaše údaje ke komunikaci v
          rámci redakce. Pokud vás šéfredakce přijme, uchováme vaše kontaktní
          údaje bez časového omezení i po vašem odchodu, abychom s vámi zůstali
          ve spojení. Přihlášku smažeme po 12 měsících od jejího potvrzení.
          Nepotvrzené přihlášky pravidelně mažeme po vypršení potvrzovacích
          odkazů. Pokud chcete kontaktní údaje smazat nebo se na zpracování
          údajů zeptat, napište nám na udaje@vednemesicnik.cz.
        </p>

        <Button
          className={styles.submit}
          disabled={isSubmitting}
          type={'submit'}
        >
          Odeslat přihlášku
        </Button>
      </Form>
    </div>
  )
}
