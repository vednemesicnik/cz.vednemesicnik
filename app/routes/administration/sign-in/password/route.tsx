// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { href, useNavigation } from 'react-router'
import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { AdminSignInCardHeading } from '~/components/admin/admin-sign-in-card-heading'
import { AdminSignInText } from '~/components/admin/admin-sign-in-text'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'
import { useHydrated } from '~/utils/use-hydrated'
import { withRedirectTo } from '~/utils/with-redirect-to'
import { schema } from './_schema'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

export default function RouteComponent({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultNoValidate: isHydrated,
    defaultValue: { email: loaderData.email ?? undefined },
    id: 'password-sign-in',
    lastResult: actionData?.submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const formErrorsCount = form.errors?.length ?? 0
  const passwordErrorsCount = fields.password.errors?.length ?? 0

  useEffect(() => {
    const passwordInput = passwordInputRef.current
    if (passwordInput === null) return

    if (formErrorsCount > 0 || passwordErrorsCount > 0) {
      passwordInput.value = ''
    }
  }, [formErrorsCount, passwordErrorsCount])

  // The emergency password sign-in (design 20d). Copy approved (gs905c2e).
  return (
    <AdminSignInCard>
      <AdminSignInCardHeading>Nouzové přihlášení</AdminSignInCardHeading>
      <AdminSignInText>
        Pro případ, že nefunguje Google, passkey ani odkaz v e-mailu.
      </AdminSignInText>

      {/* Until the next attempt, which brings its own answer (a failed one
          does not revalidate the loader). */}
      {loaderData.twoFactorEnded !== null && actionData === undefined ? (
        <Callout role={'alert'} tone={'error'}>
          {loaderData.twoFactorEnded === 'locked'
            ? 'Zadejte heslo znovu — kód byl pětkrát zadán nesprávně.'
            : 'Zadejte heslo znovu — čas na ověření vypršel.'}
        </Callout>
      ) : null}

      <Form {...getFormProps(form)} errors={form.errors} method={'post'}>
        <HoneypotInputs />
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={loaderData.redirectTo}
        />

        <TextField
          errors={fields.email.errors}
          id={fields.email.id}
          required={fields.email.required}
        >
          <TextFieldLabel isRequiredMarkHidden>E-mail</TextFieldLabel>
          <TextFieldControl
            {...getInputProps(fields.email, { type: 'email' })}
          />
        </TextField>

        <TextField
          errors={fields.password.errors}
          id={fields.password.id}
          required={fields.password.required}
        >
          <TextFieldLabel isRequiredMarkHidden>Heslo</TextFieldLabel>
          <TextFieldControl
            ref={passwordInputRef}
            {...getInputProps(fields.password, { type: 'password' })}
          />
        </TextField>

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Přihlašuji…' : 'Přihlásit se'}
        </Button>
      </Form>

      <Link
        to={withRedirectTo(
          href('/administration/sign-in'),
          loaderData.redirectTo,
        )}
      >
        Zpět na přihlášení
      </Link>
    </AdminSignInCard>
  )
}
