// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useLocation, useNavigation } from 'react-router'
import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Form } from '~/components/form'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { TextField } from '~/components/text-field'
import { useHydrated } from '~/utils/use-hydrated'
import { withRedirectTo } from '~/utils/with-redirect-to'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { PasskeyForm } from './components/passkey-form'
import { schema as magicLinkSchema } from './magic-link/_schema'

export { loader } from './_loader'
export { meta } from './_meta'

// The sign-in chooser (design 20a, 20e). Copy approved (gs905c2e, uquz5xhn).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const isHydrated = useHydrated()
  const location = useLocation()
  const navigation = useNavigation()

  const magicLinkAction = withRedirectTo(
    href('/administration/sign-in/magic-link'),
    loaderData.redirectTo,
  )
  const isSendingLink =
    navigation.state !== 'idle' &&
    navigation.formAction?.startsWith(
      href('/administration/sign-in/magic-link'),
    ) === true

  // Zadat jiný e-mail on the sent state (20b) comes back with the address.
  const typedEmail: unknown = location.state?.email

  const [form, fields] = useForm({
    constraint: getZodConstraint(magicLinkSchema),
    defaultNoValidate: isHydrated,
    defaultValue: {
      email: typeof typedEmail === 'string' ? typedEmail : undefined,
    },
    id: 'magic-link-sign-in',
    lastResult: loaderData.magicLinkResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: magicLinkSchema })
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  return (
    <AdminSignInCard title={'Přihlášení do administrace'} wordmark>
      {loaderData.error !== null ? (
        <Callout role={'alert'} tone={'error'}>
          {loaderData.error}
        </Callout>
      ) : null}

      {/* Native POST: the action redirects to google.com, so we want a full
          top-level navigation (not a client-side fetch). */}
      <form action={href('/administration/sign-in/google')} method={'post'}>
        <HoneypotInputs />
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={loaderData.redirectTo}
        />
        <Button type={'submit'}>Přihlásit se přes Google</Button>
      </form>

      <PasskeyForm redirectTo={loaderData.redirectTo} />

      <p className={styles.divider}>nebo odkazem v e-mailu</p>

      {/* Posts to the magic-link page, which shows the sent state (20b); a
          rejected request comes back to this field. */}
      <Form {...getFormProps(form)} action={magicLinkAction} method={'post'}>
        <HoneypotInputs />
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={loaderData.redirectTo}
        />

        <TextField
          errors={fields.email.errors}
          label={'E-mail'}
          {...getInputProps(fields.email, { type: 'email' })}
          autoComplete={'email'}
          placeholder={'jmeno@vednemesicnik.cz'}
        />

        <Button disabled={isSendingLink} type={'submit'} variant={'outline'}>
          {isSendingLink ? 'Odesílám…' : 'Poslat odkaz'}
        </Button>
      </Form>

      {loaderData.allowPasswordSignIn ? (
        <Link
          to={withRedirectTo(
            href('/administration/sign-in/password'),
            loaderData.redirectTo,
          )}
        >
          Nouzové přihlášení heslem
        </Link>
      ) : null}
    </AdminSignInCard>
  )
}
