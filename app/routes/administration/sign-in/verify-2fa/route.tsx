// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useSearchParams } from 'react-router'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { AdminSignInText } from '~/components/admin/admin-sign-in-text'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { useHydrated } from '~/utils/use-hydrated'
import { schema } from './_schema'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

// The second step of the emergency password sign-in (design 20d). Copy approved
// (gs905c2e).
export default function RouteComponent({ actionData }: Route.ComponentProps) {
  const isHydrated = useHydrated()

  // The method lives in the URL, so the switch works without JavaScript and the
  // form keeps it across a failed attempt (it posts to the current URL).
  const [searchParams] = useSearchParams()
  const isBackupCodeMethod = searchParams.get('method') === 'backup'

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultNoValidate: isHydrated,
    id: 'two-factor-sign-in',
    lastResult: actionData?.submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  return (
    <AdminSignInCard title={'Dvoufázové ověření'}>
      <AdminSignInText>
        {isBackupCodeMethod
          ? 'Zadejte jeden ze záložních kódů. Každý platí jen jednou.'
          : 'Zadejte šestimístný kód z ověřovací aplikace.'}
      </AdminSignInText>

      <Form {...getFormProps(form)} errors={form.errors} method={'post'}>
        <HoneypotInputs />

        {/* Only the visible field is submitted, so the action branches on
            whichever of code / backupCode is present. */}
        {isBackupCodeMethod ? (
          <AdminInput
            errors={fields.backupCode.errors}
            label={'Záložní kód'}
            {...getInputProps(fields.backupCode, { type: 'text' })}
            autoComplete={'one-time-code'}
            placeholder={'k7m2-9xqp'}
          />
        ) : (
          <AdminInput
            errors={fields.code.errors}
            label={'Kód'}
            {...getInputProps(fields.code, { type: 'text' })}
            autoComplete={'one-time-code'}
            inputMode={'numeric'}
          />
        )}

        <Button type="submit">Ověřit</Button>
      </Form>

      <Link
        preventScrollReset
        replace
        to={isBackupCodeMethod ? '.' : '?method=backup'}
      >
        {isBackupCodeMethod ? 'Použít kód z aplikace' : 'Použít záložní kód'}
      </Link>
    </AdminSignInCard>
  )
}
