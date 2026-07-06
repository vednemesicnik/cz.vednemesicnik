// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { Link, useNavigation } from 'react-router'
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

export default function RouteComponent({ actionData }: Route.ComponentProps) {
  const isHydrated = useHydrated()
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultNoValidate: isHydrated,
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

  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Přihlášení heslem</h1>

        <p className={styles.subtitle}>
          Zadejte své přihlašovací údaje pro přístup do administrace
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
            placeholder={'vas-email@example.com'}
          />

          <AdminInput
            errors={fields.password.errors}
            label={'Heslo'}
            ref={passwordInputRef}
            {...getInputProps(fields.password, { type: 'password' })}
            placeholder={'••••••••'}
          />

          <AdminButton
            className={styles.button}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Přihlašuji…' : 'Přihlásit se'}
          </AdminButton>
        </Form>

        <div className={styles.footer}>
          <Link className={styles.link} to={'/administration/sign-in'}>
            Zpět na výběr přihlášení
          </Link>
        </div>
      </section>
    </div>
  )
}
