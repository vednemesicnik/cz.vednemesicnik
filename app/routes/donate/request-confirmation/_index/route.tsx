// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Form, href, useNavigation } from 'react-router'
import { BackLink } from '~/components/back-link'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { AddIcon } from '~/components/icons/add-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { Page } from '~/components/page'
import { Subheadline } from '~/components/subheadline'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { year, honeypotInputProps } = loaderData
  const nav = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: { accounts: [''], country: 'Česká republika' },
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })
  const accountList = fields.accounts.getFieldList()

  return (
    <HoneypotProvider {...honeypotInputProps}>
      <Page>
        <BackLink className={styles.backLink} to={href('/donate')}>
          Zpět na darování
        </BackLink>

        <HeadlineGroup>
          <Headline>Žádost o potvrzení o daru za rok {year}</Headline>
          <Subheadline>
            Pokud jste v roce {year} podpořili Vedneměsíčník darem, můžete
            prostřednictvím tohoto formuláře požádat o vystavení potvrzení o
            daru pro daňové účely.
          </Subheadline>
        </HeadlineGroup>

        <Callout>
          O potvrzení lze požádat pouze za předchozí kalendářní rok. Rok je
          nastaven automaticky a nelze jej změnit.
        </Callout>

        <section className={styles.formCard}>
          {form.errors && form.errors.length > 0 ? (
            <p className={styles.formError} role="alert">
              {form.errors.join(' ')}
            </p>
          ) : null}

          <Form method="post" {...getFormProps(form)} className={styles.form}>
            <HoneypotInputs />

            <input name="year" readOnly type="hidden" value={year} />

            <div className={styles.field}>
              <label className={styles.label} htmlFor="year-display">
                Rok daru
              </label>
              <input
                className={styles.input}
                disabled
                id="year-display"
                readOnly
                type="text"
                value={String(year)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={fields.fullName.id}>
                Jméno a příjmení <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                {...getInputProps(fields.fullName, { type: 'text' })}
              />
              {fields.fullName.errors ? (
                <span className={styles.fieldError}>
                  {fields.fullName.errors}
                </span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={fields.street.id}>
                Ulice a číslo <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                {...getInputProps(fields.street, { type: 'text' })}
              />
              {fields.street.errors ? (
                <span className={styles.fieldError}>
                  {fields.street.errors}
                </span>
              ) : null}
            </div>

            <div className={styles.twoColNarrowFirst}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={fields.postalCode.id}>
                  PSČ <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  {...getInputProps(fields.postalCode, { type: 'text' })}
                  inputMode="numeric"
                  placeholder="123 45"
                />
                {fields.postalCode.errors ? (
                  <span className={styles.fieldError}>
                    {fields.postalCode.errors}
                  </span>
                ) : null}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor={fields.city.id}>
                  Obec <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  {...getInputProps(fields.city, { type: 'text' })}
                />
                {fields.city.errors ? (
                  <span className={styles.fieldError}>
                    {fields.city.errors}
                  </span>
                ) : null}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={fields.country.id}>
                Stát <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                {...getInputProps(fields.country, { type: 'text' })}
              />
              {fields.country.errors ? (
                <span className={styles.fieldError}>
                  {fields.country.errors}
                </span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={fields.email.id}>
                E-mail <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                {...getInputProps(fields.email, { type: 'email' })}
                placeholder="vas@email.cz"
              />
              <span className={styles.hint}>
                Na tuto e-mailovou adresu vám zašleme potvrzení o daru.
              </span>
              {fields.email.errors ? (
                <span className={styles.fieldError}>{fields.email.errors}</span>
              ) : null}
            </div>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                Čísla účtů, ze kterých byl dar odeslán{' '}
                <span className={styles.required}>*</span>
              </legend>
              <span className={styles.hint}>
                Uveďte číslo účtu, ze kterého byl dar odeslán. Pokud jste
                použili více účtů, přidejte další pole.
              </span>
              {accountList.map((account, index) => (
                <div className={styles.accountRow} key={account.key}>
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      {...getInputProps(account, { type: 'text' })}
                      placeholder="123456789/0100"
                    />
                    {account.errors ? (
                      <span className={styles.fieldError}>
                        {account.errors}
                      </span>
                    ) : null}
                  </div>
                  {accountList.length > 1 ? (
                    <Button
                      color="danger"
                      size={'md'}
                      variant="filled"
                      {...form.remove.getButtonProps({
                        index,
                        name: fields.accounts.name,
                      })}
                    >
                      <DeleteIcon />
                      Odebrat
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                className={styles.addButton}
                size="sm"
                variant="outline"
                {...form.insert.getButtonProps({
                  name: fields.accounts.name,
                })}
              >
                <AddIcon />
                Přidat účet
              </Button>
              {fields.accounts.errors ? (
                <span className={styles.fieldError}>
                  {fields.accounts.errors}
                </span>
              ) : null}
            </fieldset>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={fields.note.id}>
                Doplňující informace{' '}
                <span className={styles.optional}>(nepovinné)</span>
              </label>
              <textarea
                className={styles.textarea}
                {...getTextareaProps(fields.note)}
                rows={3}
              />
              <span className={styles.hint}>
                Můžete uvést například přibližné datum daru nebo další
                informace, které nám pomohou dar dohledat.
              </span>
            </div>

            <div className={styles.gdpr}>
              <p className={styles.gdprText}>
                Odesláním formuláře berete na vědomí, že spolek Vedneměsíčník,
                z. s. zpracuje uvedené osobní údaje za účelem vyřízení žádosti a
                vystavení potvrzení o daru. Údaje budou uchovány pouze po dobu
                nezbytnou k vyřízení žádosti a splnění souvisejících zákonných
                povinností.
              </p>
            </div>

            <Button
              className={styles.submitButton}
              disabled={nav.state !== 'idle'}
              size="lg"
              type="submit"
            >
              {nav.state === 'submitting' ? 'Odesílám…' : 'Odeslat žádost'}
            </Button>
          </Form>
        </section>
      </Page>
    </HoneypotProvider>
  )
}
