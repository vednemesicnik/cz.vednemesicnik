// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useRef } from 'react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { Input } from '~/components/input'
import { useHydrated } from '~/utils/use-hydrated'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ actionData }: Route.ComponentProps) {
  const isHydrated = useHydrated()
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
        <h1 className={styles.title}>Přihlášení</h1>
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

          <Input
            errors={fields.email.errors}
            label={'E-mail'}
            {...getInputProps(fields.email, { type: 'email' })}
            placeholder={'vas-email@example.com'}
          />

          <Input
            errors={fields.password.errors}
            label={'Heslo'}
            ref={passwordInputRef}
            {...getInputProps(fields.password, { type: 'password' })}
            placeholder={'••••••••'}
          />

          <Button className={styles.button} type="submit">
            Přihlásit se
          </Button>
        </Form>
      </section>
    </div>
  )
}
