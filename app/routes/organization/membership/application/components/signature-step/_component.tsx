import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useRef } from 'react'
import { href, useNavigation } from 'react-router'

import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { Heading } from '~/components/heading'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Hyperlink } from '~/components/hyperlink'
import { Link } from '~/components/link'
import { ORGANIZATION_REGISTRATION_NUMBER } from '~/config/site-config'
import { useHydrated } from '~/utils/use-hydrated'

import { signatureSchema } from '../../_schema'
import { getStepPath } from '../../_step'
import { DeclarationFrame } from '../declaration-frame'
import { DeclarationUploadField } from '../declaration-upload-field'
import { PrintDeclarationButton } from '../print-declaration-button'
import styles from './_styles.module.css'

type Props = {
  /** Under 18 today: the guardian signs too. */
  isMinor: boolean
  submissionResult: SubmissionResult<string[]> | undefined
}

/**
 * The second step (design 15d): the filled declaration to print and sign, and
 * the upload of the signed scan. On a computer the sheet stands on the left and
 * the steps on the right, so the print section dissolves into the page's grid.
 */
export const SignatureStep = ({ isMinor, submissionResult }: Props) => {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  // Set only by a submission, redirect included; a link leaves it undefined.
  const isSubmitting = navigation.formMethod !== undefined
  const frameRef = useRef<HTMLIFrameElement>(null)

  const [form, fields] = useForm({
    defaultNoValidate: isHydrated,
    id: 'membership-signature',
    lastResult: submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signatureSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  // Only for someone under 18, so it needs no condition of its own (l2tfx4sx).
  const guardianSentence = ' Prohlášení musí podepsat i zákonný zástupce.'

  return (
    <div className={styles.step}>
      <p className={styles.lead}>
        Vytiskněte prohlášení, podepište ho a nahrajte sken nebo fotku. Pak
        přihlášku odešlete.
      </p>

      <section className={styles.print}>
        <Heading className={styles.heading} level={2}>
          Vytiskněte a podepište
        </Heading>

        <div className={styles.document}>
          <DeclarationFrame frameRef={frameRef} />
          <Hyperlink
            className={styles.openLink}
            href={href('/organization/membership/application/declaration')}
          >
            Otevřít prohlášení samostatně
          </Hyperlink>
        </div>

        <p className={styles.helpWide}>
          Vytiskne se jen prohlášení. V nabídce tisku ho můžete také uložit jako
          PDF. Podepište ho vlastní rukou.{isMinor && guardianSentence}
        </p>

        <div className={styles.actions}>
          <PrintDeclarationButton
            className={styles.printButton}
            frameRef={frameRef}
          />
          <Link className={styles.fixLink} to={getStepPath('details')}>
            Opravit údaje
          </Link>
        </div>

        <p className={styles.helpNarrow}>
          V nabídce tisku můžete prohlášení uložit jako PDF a vytisknout ho
          jinde. Podepište ho vlastní rukou.{isMinor && guardianSentence}
        </p>
      </section>

      <section className={styles.upload}>
        <Heading className={styles.heading} level={2}>
          Nahrajte podepsané prohlášení
        </Heading>

        <Form
          {...getFormProps(form)}
          className={styles.form}
          encType={'multipart/form-data'}
          method={'post'}
        >
          <HoneypotInputs />

          {form.errors !== undefined && form.errors.length > 0 && (
            <Callout className={styles.callout} role={'alert'} tone={'error'}>
              {form.errors[0]}
            </Callout>
          )}

          <DeclarationUploadField
            {...getInputProps(fields.declaration, { type: 'file' })}
            errors={fields.declaration.errors}
          />

          <p className={styles.dataNotice}>
            Vaše údaje a podepsané prohlášení bude spolek
            Vedneměsíčník,&nbsp;z.&nbsp;s., IČO&nbsp;
            {ORGANIZATION_REGISTRATION_NUMBER}, zpracovávat pro vyřízení
            přihlášky a po přijetí pro vedení členských záznamů. O přijetí
            rozhodne spolek. Odesláním přihlášky členství nevzniká. Pokud vás
            přijmeme, pošleme vám potvrzení e-mailem. Pokud do 12 měsíců od
            podání přihlášky nezaznamenáme vaše přijetí, přihlášku i podepsané
            prohlášení smažeme. Přihlášku i podepsané prohlášení se zaznamenaným
            přijetím uchováváme bez časového omezení. S dotazy ke zpracování
            údajů nám napište na udaje@vednemesicnik.cz.
          </p>

          <Button
            className={styles.submit}
            disabled={isSubmitting}
            type={'submit'}
          >
            {isSubmitting ? 'Odesílání…' : 'Odeslat přihlášku'}
          </Button>
        </Form>
      </section>
    </div>
  )
}
