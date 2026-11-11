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
import { MailHyperlink } from '~/components/mail-hyperlink'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'
import { TextareaField } from '~/components/textarea-field'
import { TextareaFieldControl } from '~/components/textarea-field-control'
import { TextareaFieldLabel } from '~/components/textarea-field-label'
import { ORGANIZATION_REGISTRATION_NUMBER } from '~/config/site-config'
import { useHydrated } from '~/utils/use-hydrated'

import { enrolmentSchema } from '../../_schema'
import styles from './_styles.module.css'

const PERSONAL_DATA_ADDRESS = 'udaje@vednemesicnik.cz'

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
        <TextField errors={fields.email.errors} id={fields.email.id} required>
          <TextFieldLabel>E-mail</TextFieldLabel>
          <TextFieldControl
            autoComplete={'email'}
            {...getInputProps(fields.email, { type: 'email' })}
          />
        </TextField>
        <TextField errors={fields.phone.errors} id={fields.phone.id} required>
          <TextFieldLabel>Telefon</TextFieldLabel>
          <TextFieldControl
            autoComplete={'tel'}
            {...getInputProps(fields.phone, { type: 'tel' })}
          />
        </TextField>
        <TextareaField field={fields.interest}>
          <TextareaFieldLabel optional>
            Čemu byste se chtěli věnovat?
          </TextareaFieldLabel>
          <TextareaFieldControl
            placeholder={'psaní, focení, korektury…'}
            rows={3}
          />
        </TextareaField>

        <p className={styles.notice}>
          Odesláním přihlášky potvrzujete, že vám je alespoň 15&nbsp;let. Vaše
          údaje používáme ke komunikaci v rámci redakce. Zpracovává je spolek
          Vedneměsíčník,&nbsp;z.&nbsp;s., IČO&nbsp;
          {ORGANIZATION_REGISTRATION_NUMBER}. Pokud přihlášku potvrdíte, smažeme
          ji po 12&nbsp;měsících od potvrzení, ať vás šéfredakce přijme, nebo
          ne. Pokud ji nepotvrdíte, smažeme ji nejpozději den po vypršení odkazu
          k potvrzení. Odkaz platí 72&nbsp;hodin. Pokud vás šéfredakce přijme,
          uchováme vaše kontaktní údaje zvlášť, bez časového omezení i po vašem
          odchodu z redakce, abychom s vámi zůstali ve spojení. O jejich smazání
          můžete požádat na{' '}
          <MailHyperlink address={PERSONAL_DATA_ADDRESS}>
            {PERSONAL_DATA_ADDRESS}
          </MailHyperlink>
          . Na stejnou adresu nám můžete napsat i s dotazy ke zpracování údajů.
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
