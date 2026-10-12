// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'

import { AdminInput } from '~/components/admin/admin-input'
import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { AdminSignInText } from '~/components/admin/admin-sign-in-text'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { useHydrated } from '~/utils/use-hydrated'
import { withRedirectTo } from '~/utils/with-redirect-to'

import { schema } from './_schema'
import styles from './_styles.module.css'
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

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultNoValidate: isHydrated,
    id: 'magic-link-sign-in',
    lastResult: actionData?.submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

  const backLink = (
    <Link
      to={withRedirectTo(
        href('/administration/sign-in'),
        loaderData.redirectTo,
      )}
    >
      Zpět na výběr přihlášení
    </Link>
  )

  // The sent state (design 20b). Copy approved (gs905c2e).
  if (actionData?.sent === true) {
    return (
      <AdminSignInCard title={'Zkontrolujte e-mail'}>
        <AdminSignInText>
          Pokud k adrese{' '}
          <span className={styles.value}>{actionData.email}</span> patří účet,
          odkaz byl odeslán. Platí 15 minut.
        </AdminSignInText>
        <AdminSignInText variant={'quiet'}>
          Odkaz můžete otevřít i na jiném zařízení. Přihlásíte se na něm po
          potvrzení.
        </AdminSignInText>
        {backLink}
      </AdminSignInCard>
    )
  }

  // Until the field moves onto the chooser (20a), its own page.
  return (
    <AdminSignInCard title={'Přihlášení odkazem'}>
      <AdminSignInText>
        Zadejte svůj e-mail a my vám pošleme odkaz pro přihlášení do
        administrace
      </AdminSignInText>

      <Form {...getFormProps(form)} errors={form.errors} method={'post'}>
        <HoneypotInputs />
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={loaderData.redirectTo}
        />

        <AdminInput
          errors={fields.email.errors}
          label={'E-mail'}
          {...getInputProps(fields.email, { type: 'email' })}
          placeholder={'vas-email@vednemesicnik.cz'}
        />

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Odesílám…' : 'Poslat odkaz'}
        </Button>
      </Form>

      {backLink}
    </AdminSignInCard>
  )
}
