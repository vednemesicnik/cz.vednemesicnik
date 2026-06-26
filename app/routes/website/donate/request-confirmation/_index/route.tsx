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
import { ErrorMessage } from './components/error-message'
import { FieldGroup } from './components/field-group'
import { FieldGroupLabel } from './components/field-group-label'
import { FormField } from './components/form-field'
import { Hint } from './components/hint'
import { Input } from './components/input'
import { Label } from './components/label'
import { RadioOption } from './components/radio-option'
import { RadioOptionGroup } from './components/radio-option-group'
import { Textarea } from './components/textarea'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { requestableYears, honeypotInputProps } = loaderData
  const nav = useNavigation()
  const errorAlertRef = useRef<HTMLDivElement>(null)

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
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

        <HeadlineGroup>
          <Headline>Žádost o potvrzení o daru</Headline>
          <Subheadline>
            Pokud jste podpořili Vedneměsíčník darem, můžete prostřednictvím
            tohoto formuláře požádat o vystavení potvrzení pro daňové účely.
          </Subheadline>
        </HeadlineGroup>

        <Callout>
          O potvrzení lze požádat až 3 roky zpětně. Ve formuláři vyberte rok, za
          který o potvrzení žádáte.
        </Callout>

        <section className={styles.formCard}>
          <div className={styles.formErrorWrapper} ref={errorAlertRef}>
            {form.errors && form.errors.length > 0 ? (
              <Alert className={styles.formError}>
                {form.errors.join(' ')}
              </Alert>
            ) : null}
          </div>

          <Form method="post" {...getFormProps(form)} className={styles.form}>
            <HoneypotInputs />

            <FieldGroup>
              <FieldGroupLabel required>Rok daru</FieldGroupLabel>
              <Hint>Vyberte rok, za který o potvrzení žádáte.</Hint>
              <RadioOptionGroup>
                {getCollectionProps(fields.year, {
                  options: requestableYears,
                  type: 'radio',
                }).map(({ key, value, ...rest }) => (
                  <RadioOption key={key} value={value} {...rest}>
                    {value}
                  </RadioOption>
                ))}
              </RadioOptionGroup>
              <ErrorMessage>{fields.year.errors}</ErrorMessage>
            </FieldGroup>

            <FieldGroup>
              <FieldGroupLabel>Typ dárce</FieldGroupLabel>
              <RadioOptionGroup>
                <RadioOption
                  checked={type.value === 'individual'}
                  onBlur={type.blur}
                  onChange={() => type.change('individual')}
                  onFocus={type.focus}
                >
                  Fyzická osoba
                </RadioOption>
                <RadioOption
                  checked={type.value === 'sole_trader'}
                  onBlur={type.blur}
                  onChange={() => type.change('sole_trader')}
                  onFocus={type.focus}
                >
                  Podnikající fyzická osoba
                </RadioOption>
                <RadioOption
                  checked={type.value === 'entity'}
                  onBlur={type.blur}
                  onChange={() => type.change('entity')}
                  onFocus={type.focus}
                >
                  Právnická osoba
                </RadioOption>
              </RadioOptionGroup>
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
                    inputMode="numeric"
                    placeholder="DD.MM.RRRR"
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
                    Název firmy
                  </Label>
                  <Input
                    {...getInputProps(
                      fields.companyName as FieldMetadata<string>,
                      { type: 'text' },
                    )}
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
                placeholder="vas@email.cz"
              />
              <Hint>
                Na tuto e-mailovou adresu vám zašleme potvrzení o daru.
              </Hint>
              <ErrorMessage>{fields.email.errors}</ErrorMessage>
            </FormField>

            <FieldGroup>
              <FieldGroupLabel required>
                Čísla účtů, ze kterých byl dar odeslán
              </FieldGroupLabel>
              <Hint>
                Uveďte číslo účtu, ze kterého byl dar odeslán. Pokud jste
                použili více účtů, přidejte další pole.
              </Hint>
              {accountList.map((account, index) => (
                <FormField key={account.key}>
                  <div className={styles.accountInputRow}>
                    <Input
                      {...getInputProps(account, { type: 'text' })}
                      placeholder="123456789/0800"
                    />
                    {accountList.length > 1 ? (
                      <Button
                        color="danger"
                        size="md"
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
                <AddIcon />
                Přidat účet
              </Button>
              <ErrorMessage>{fields.accounts.errors}</ErrorMessage>
            </FieldGroup>

            <FormField>
              <Label htmlFor={fields.note.id}>Doplňující informace</Label>
              <Textarea {...getTextareaProps(fields.note)} />
              <Hint>
                Můžete uvést informace, které nám pomohou dar dohledat.
              </Hint>
              <ErrorMessage>{fields.note.errors}</ErrorMessage>
            </FormField>

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
