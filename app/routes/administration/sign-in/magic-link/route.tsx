// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Link } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminInput } from '~/components/admin/admin-input'
import { Form } from '~/components/form'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { useHydrated } from '~/utils/use-hydrated'

import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

export default function RouteComponent({ actionData }: Route.ComponentProps) {
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

  const sent = actionData?.sent === true

  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Přihlášení odkazem</h1>

        {sent ? (
          <p className={styles.message}>
            Pokud účet existuje, poslali jsme na e-mail přihlašovací odkaz.
            Odkaz je platný 15 minut.
          </p>
        ) : (
          <>
            <p className={styles.subtitle}>
              Zadejte svůj e-mail a my vám pošleme odkaz pro přihlášení do
              administrace
            </p>

            <Form
              {...getFormProps(form)}
              className={styles.form}
              errors={form.errors}
              method={'post'}
            >
              <HoneypotInputs />

              <AdminInput
                errors={fields.email.errors}
                label={'E-mail'}
                {...getInputProps(fields.email, { type: 'email' })}
                placeholder={'vas-email@vednemesicnik.cz'}
              />

              <AdminButton className={styles.button} type="submit">
                Poslat odkaz
              </AdminButton>
            </Form>
          </>
        )}

        <div className={styles.footer}>
          <Link className={styles.link} to={'/administration/sign-in'}>
            Zpět na výběr přihlášení
          </Link>
        </div>
      </section>
    </div>
  )
}
