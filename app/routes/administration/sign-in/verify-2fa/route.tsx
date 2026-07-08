// noinspection JSUnusedGlobalSymbols
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useState } from 'react'
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
  const [useBackupCode, setUseBackupCode] = useState(false)

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
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Dvoufázové ověření</h1>

        <p className={styles.subtitle}>
          {useBackupCode
            ? 'Zadejte jeden ze svých záložních kódů'
            : 'Zadejte šestimístný kód z vaší autentikační aplikace'}
        </p>

        <Form
          {...getFormProps(form)}
          className={styles.form}
          errors={form.errors}
          method={'post'}
        >
          <HoneypotInputs />

          {/* Only the visible field is submitted, so the action branches on
              whichever of code / backupCode is present. */}
          {useBackupCode ? (
            <AdminInput
              errors={fields.backupCode.errors}
              label={'Záložní kód'}
              {...getInputProps(fields.backupCode, { type: 'text' })}
              autoComplete={'one-time-code'}
              placeholder={'xxxx-xxxx'}
            />
          ) : (
            <AdminInput
              errors={fields.code.errors}
              label={'Ověřovací kód'}
              {...getInputProps(fields.code, { type: 'text' })}
              autoComplete={'one-time-code'}
              inputMode={'numeric'}
              placeholder={'123456'}
            />
          )}

          <AdminButton className={styles.button} type="submit">
            Ověřit
          </AdminButton>
        </Form>

        {isHydrated && (
          <button
            aria-pressed={useBackupCode}
            className={styles.toggle}
            onClick={() => setUseBackupCode((value) => !value)}
            type="button"
          >
            {useBackupCode
              ? 'Zpět na kód z aplikace'
              : 'Nemáte přístup k aplikaci? Použít záložní kód'}
          </button>
        )}
      </section>
    </div>
  )
}
