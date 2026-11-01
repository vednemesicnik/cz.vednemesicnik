import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'

import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Hyperlink } from '~/components/hyperlink'
import { TextField } from '~/components/text-field'
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

/** The first step (design 15d): every field is required, so none says so. */
export const DetailsStep = ({
  details,
  isExpired,
  submissionResult,
}: Props) => {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

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

  return (
    <div className={styles.step}>
      {isExpired && (
        <Callout className={styles.callout}>
          Vyplněné údaje už nejsou k dispozici. Vyplňte je prosím znovu.
        </Callout>
      )}

      <Form
        {...getFormProps(form)}
        className={styles.form}
        errors={form.errors}
        method={'post'}
      >
        <HoneypotInputs />

        <TextField
          autoComplete={'given-name'}
          errors={fields.firstName.errors}
          label={'Jméno'}
          {...getInputProps(fields.firstName, { type: 'text' })}
        />
        <TextField
          autoComplete={'family-name'}
          errors={fields.lastName.errors}
          label={'Příjmení'}
          {...getInputProps(fields.lastName, { type: 'text' })}
        />
        <TextField
          errors={fields.dateOfBirth.errors}
          hint={'Mladším 18 let podepíše prohlášení i zákonný zástupce.'}
          label={'Datum narození'}
          placeholder={'14. 5. 2009'}
          {...getInputProps(fields.dateOfBirth, { type: 'text' })}
        />
        <TextField
          autoComplete={'street-address'}
          errors={fields.address.errors}
          label={'Adresa trvalého bydliště'}
          {...getInputProps(fields.address, { type: 'text' })}
        />
        <TextField
          autoComplete={'email'}
          errors={fields.email.errors}
          label={'E-mail'}
          {...getInputProps(fields.email, { type: 'email' })}
        />
        <TextField
          autoComplete={'tel'}
          errors={fields.phone.errors}
          label={'Telefon'}
          {...getInputProps(fields.phone, { type: 'tel' })}
        />

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
