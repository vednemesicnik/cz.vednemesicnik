// noinspection JSUnusedGlobalSymbols

import {
  type FieldMetadata,
  getCollectionProps,
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
  useInputControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { Form, href, useNavigation } from 'react-router'
import { Alert } from '~/components/alert'
import { BackLink } from '~/components/back-link'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { FormLegend } from '~/components/form-legend'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { RadioTile } from '~/components/radio-tile'
import { RadioTileGroup } from '~/components/radio-tile-group'
import { Stepper } from '~/components/stepper'
import { StepperStep } from '~/components/stepper-step'
import { Subheadline } from '~/components/subheadline'
import { ORGANIZATION_REGISTRATION_NUMBER } from '~/config/site-config'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ErrorMessage } from './components/error-message'
import { FieldGroup } from './components/field-group'
import { FieldGroupLabel } from './components/field-group-label'
import { FormField } from './components/form-field'
import { Hint } from './components/hint'
import { Input } from './components/input'
import { Label } from './components/label'
import { Textarea } from './components/textarea'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

const DONATIONS_ADDRESS = 'dary@vednemesicnik.cz'
const PERSONAL_DATA_ADDRESS = 'udaje@vednemesicnik.cz'

// Why the verify step sent the donor back (15l, 8jxiph0x; copy thread 5uc4li12).
const REASON_MESSAGES = {
  expired: 'Vyplněné údaje už nejsou k dispozici. Vyplňte je prosím znovu.',
  rejected:
    'Žádost se neodeslala. Zkontrolujte prosím vyplněné údaje a pokračujte. E-mail zůstává ověřený.',
} as const

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { details, honeypotInputProps, reason, requestableYears } = loaderData
  const nav = useNavigation()
  const errorAlertRef = useRef<HTMLDivElement>(null)

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    // Back from the code to correct them, the details are filled in again.
    defaultValue: details ?? {
      accounts: [''],
      type: 'individual',
      year: requestableYears[0],
    },
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  const type = useInputControl(fields.type)
  const addressFields = fields.address.getFieldset()
  const accountList = fields.accounts.getFieldList()

  useEffect(() => {
    if (form.errors && form.errors.length > 0) {
      errorAlertRef.current?.scrollIntoView({
        behavior: 'instant',
        block: 'start',
      })
    }
  }, [form.errors])

  return (
    <HoneypotProvider {...honeypotInputProps}>
      <Page>
        <BackLink className={styles.backLink} to={href('/donate')}>
          Zpět na darování
        </BackLink>

        <HeadlineGroup className={styles.headlineGroup}>
          <Headline>Žádost o potvrzení o daru</Headline>
          <Subheadline>
            Pokud jste Vedneměsíčník podpořili darem, můžete tu požádat o
            potvrzení pro daňové účely.
          </Subheadline>
        </HeadlineGroup>

        <Stepper className={styles.stepper} label={'Kroky žádosti'}>
          <StepperStep state={'current'}>Údaje</StepperStep>
          <StepperStep state={'upcoming'}>Ověření a odeslání</StepperStep>
        </Stepper>

        <div className={styles.column}>
          <Callout className={styles.callout}>
            O potvrzení můžete požádat za jeden ze tří předchozích kalendářních
            roků.
          </Callout>

          <section className={styles.formCard}>
            <div className={styles.formErrorWrapper} ref={errorAlertRef}>
              {form.errors && form.errors.length > 0 ? (
                <Alert className={styles.formError}>
                  {form.errors.join(' ')}
                </Alert>
              ) : reason !== null ? (
                <Alert className={styles.formError}>
                  {REASON_MESSAGES[reason]}
                </Alert>
              ) : null}
            </div>

            <Form method="post" {...getFormProps(form)} className={styles.form}>
              <HoneypotInputs />

              <FormLegend />

              <FieldGroup>
                <FieldGroupLabel required>Rok daru</FieldGroupLabel>
                <Hint>Vyberte rok, za který o potvrzení žádáte.</Hint>
                <RadioTileGroup columns={3}>
                  {getCollectionProps(fields.year, {
                    options: requestableYears,
                    type: 'radio',
                  }).map(({ key, value, ...rest }) => (
                    <RadioTile key={key} value={value} {...rest}>
                      {value}
                    </RadioTile>
                  ))}
                </RadioTileGroup>
                <ErrorMessage>{fields.year.errors}</ErrorMessage>
              </FieldGroup>

              <FieldGroup>
                <FieldGroupLabel required>Typ dárce</FieldGroupLabel>
                <RadioTileGroup columns={1}>
                  <RadioTile
                    checked={type.value === 'individual'}
                    name={fields.type.name}
                    onBlur={type.blur}
                    onChange={() => type.change('individual')}
                    onFocus={type.focus}
                    value="individual"
                  >
                    Fyzická osoba
                  </RadioTile>
                  <RadioTile
                    checked={type.value === 'sole_trader'}
                    name={fields.type.name}
                    onBlur={type.blur}
                    onChange={() => type.change('sole_trader')}
                    onFocus={type.focus}
                    value="sole_trader"
                  >
                    Podnikající fyzická osoba
                  </RadioTile>
                  <RadioTile
                    checked={type.value === 'entity'}
                    name={fields.type.name}
                    onBlur={type.blur}
                    onChange={() => type.change('entity')}
                    onFocus={type.focus}
                    value="entity"
                  >
                    Právnická osoba
                  </RadioTile>
                </RadioTileGroup>
              </FieldGroup>

              {type.value === 'individual' && (
                <>
                  <div className={styles.twoColEqual}>
                    <FormField>
                      <Label htmlFor={fields.firstName?.id} required>
                        Jméno
                      </Label>
                      <Input
                        {...getInputProps(
                          fields.firstName as FieldMetadata<string>,
                          { type: 'text' },
                        )}
                        autoComplete="given-name"
                      />
                      <ErrorMessage>{fields.firstName?.errors}</ErrorMessage>
                    </FormField>
                    <FormField>
                      <Label htmlFor={fields.lastName?.id} required>
                        Příjmení
                      </Label>
                      <Input
                        {...getInputProps(
                          fields.lastName as FieldMetadata<string>,
                          { type: 'text' },
                        )}
                        autoComplete="family-name"
                      />
                      <ErrorMessage>{fields.lastName?.errors}</ErrorMessage>
                    </FormField>
                  </div>

                  <FormField>
                    <Label htmlFor={fields.dateOfBirth?.id} required>
                      Datum narození
                    </Label>
                    <Input
                      {...getInputProps(
                        fields.dateOfBirth as FieldMetadata<string>,
                        { type: 'text' },
                      )}
                      autoComplete="bday"
                      placeholder="14. 5. 1990"
                    />
                    <ErrorMessage>{fields.dateOfBirth?.errors}</ErrorMessage>
                  </FormField>
                </>
              )}

              {type.value === 'sole_trader' && (
                <>
                  <div className={styles.twoColEqual}>
                    <FormField>
                      <Label htmlFor={fields.firstName?.id} required>
                        Jméno
                      </Label>
                      <Input
                        {...getInputProps(
                          fields.firstName as FieldMetadata<string>,
                          { type: 'text' },
                        )}
                        autoComplete="given-name"
                      />
                      <ErrorMessage>{fields.firstName?.errors}</ErrorMessage>
                    </FormField>
                    <FormField>
                      <Label htmlFor={fields.lastName?.id} required>
                        Příjmení
                      </Label>
                      <Input
                        {...getInputProps(
                          fields.lastName as FieldMetadata<string>,
                          { type: 'text' },
                        )}
                        autoComplete="family-name"
                      />
                      <ErrorMessage>{fields.lastName?.errors}</ErrorMessage>
                    </FormField>
                  </div>

                  <FormField>
                    <Label htmlFor={fields.ico?.id} required>
                      IČO
                    </Label>
                    <Input
                      {...getInputProps(fields.ico as FieldMetadata<string>, {
                        type: 'text',
                      })}
                      inputMode="numeric"
                      placeholder="12345678"
                    />
                    <ErrorMessage>{fields.ico?.errors}</ErrorMessage>
                  </FormField>
                </>
              )}

              {type.value === 'entity' && (
                <>
                  <FormField>
                    <Label htmlFor={fields.companyName?.id} required>
                      Název právnické osoby
                    </Label>
                    <Input
                      {...getInputProps(
                        fields.companyName as FieldMetadata<string>,
                        { type: 'text' },
                      )}
                      autoComplete="organization"
                    />
                    <ErrorMessage>{fields.companyName?.errors}</ErrorMessage>
                  </FormField>

                  <FormField>
                    <Label htmlFor={fields.ico?.id} required>
                      IČO
                    </Label>
                    <Input
                      {...getInputProps(fields.ico as FieldMetadata<string>, {
                        type: 'text',
                      })}
                      inputMode="numeric"
                      placeholder="12345678"
                    />
                    <ErrorMessage>{fields.ico?.errors}</ErrorMessage>
                  </FormField>
                </>
              )}

              <FormField>
                <Label htmlFor={addressFields.street.id} required>
                  Ulice a číslo
                </Label>
                <Input
                  {...getInputProps(addressFields.street, { type: 'text' })}
                  autoComplete="street-address"
                />
                <ErrorMessage>{addressFields.street.errors}</ErrorMessage>
              </FormField>

              <div className={styles.twoColNarrowFirst}>
                <FormField>
                  <Label htmlFor={addressFields.zip.id} required>
                    PSČ
                  </Label>
                  <Input
                    {...getInputProps(addressFields.zip, { type: 'text' })}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    placeholder="123 45"
                  />
                  <ErrorMessage>{addressFields.zip.errors}</ErrorMessage>
                </FormField>
                <FormField>
                  <Label htmlFor={addressFields.city.id} required>
                    Obec
                  </Label>
                  <Input
                    {...getInputProps(addressFields.city, { type: 'text' })}
                    autoComplete="address-level2"
                  />
                  <ErrorMessage>{addressFields.city.errors}</ErrorMessage>
                </FormField>
              </div>

              <FormField>
                <Label htmlFor={fields.email.id} required>
                  E-mail
                </Label>
                <Input
                  {...getInputProps(fields.email, { type: 'email' })}
                  autoComplete="email"
                />
                <Hint>
                  E-mail ověříte kódem. Na tuto adresu vám pak pošleme i
                  potvrzení o daru.
                </Hint>
                <ErrorMessage>{fields.email.errors}</ErrorMessage>
              </FormField>

              <FieldGroup>
                <FieldGroupLabel required>
                  Čísla účtů, ze kterých dar přišel
                </FieldGroupLabel>
                <Hint>Pokud jste posílali z více účtů, přidejte další.</Hint>
                {accountList.map((account, index) => (
                  <FormField key={account.key}>
                    <div className={styles.accountInputRow}>
                      <Input
                        {...getInputProps(account, { type: 'text' })}
                        placeholder="123456789/0800"
                      />
                      {accountList.length > 1 ? (
                        <Button
                          aria-label={`Odebrat účet ${index + 1}`}
                          size="sm"
                          variant="outline"
                          {...form.remove.getButtonProps({
                            index,
                            name: fields.accounts.name,
                          })}
                        >
                          Odebrat
                        </Button>
                      ) : null}
                    </div>
                    <ErrorMessage>{account.errors}</ErrorMessage>
                  </FormField>
                ))}
                <Button
                  className={styles.addButton}
                  size="sm"
                  variant="outline"
                  {...form.insert.getButtonProps({
                    name: fields.accounts.name,
                  })}
                >
                  Přidat účet
                </Button>
                <ErrorMessage>{fields.accounts.errors}</ErrorMessage>
                <p className={styles.foreignAccount}>
                  Dar jste poslali ze zahraničního účtu? O potvrzení požádejte
                  e-mailem na{' '}
                  <MailHyperlink address={DONATIONS_ADDRESS}>
                    {DONATIONS_ADDRESS}
                  </MailHyperlink>
                  .
                </p>
              </FieldGroup>

              <FormField>
                <Label htmlFor={fields.note.id}>Doplňující informace</Label>
                <Textarea {...getTextareaProps(fields.note)} />
                <Hint>Cokoli, co nám pomůže dar dohledat.</Hint>
                <ErrorMessage>{fields.note.errors}</ErrorMessage>
              </FormField>

              <p className={styles.notice}>
                Spolek Vedneměsíčník,&nbsp;z.&nbsp;s., IČO&nbsp;
                {ORGANIZATION_REGISTRATION_NUMBER}, použije uvedené údaje k
                dohledání darů, vyřízení žádosti a vystavení potvrzení. Údaje ze
                žádosti uchováme do vystavení a odeslání potvrzení. Poté je
                smažeme. S dotazy ke zpracování údajů nám napište na{' '}
                <MailHyperlink address={PERSONAL_DATA_ADDRESS}>
                  {PERSONAL_DATA_ADDRESS}
                </MailHyperlink>
                .
              </p>

              <Button
                className={styles.submitButton}
                disabled={nav.state !== 'idle'}
                type="submit"
              >
                Pokračovat
              </Button>
            </Form>
          </section>
        </div>
      </Page>
    </HoneypotProvider>
  )
}
