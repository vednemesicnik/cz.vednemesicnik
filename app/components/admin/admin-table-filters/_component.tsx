import type { ReactNode, SubmitEvent } from 'react'
import { Form, useSubmit } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  preservedParams: [string, string][]
}

export const AdminTableFilters = ({ children, preservedParams }: Props) => {
  const submit = useSubmit()

  // A native GET submit serializes every select, so the ones left on "Vše"
  // would litter the URL with `?category=&tag=`. Submitting only the values that
  // are set keeps the URL clean. Without JS the native submit still works — the
  // parser drops the empty values server-side.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const searchParams = new URLSearchParams()

    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === 'string' && value !== '') {
        searchParams.append(name, value)
      }
    }

    void submit(searchParams, { method: 'get' })
  }

  return (
    <Form className={styles.form} method={'get'} onSubmit={handleSubmit}>
      {/* Carry the preserved params on GET submit so filtering doesn't drop
          search and sort. Build them with `getPreservedFilterParams`. */}
      {preservedParams.map(([name, value], index) => (
        <input
          key={`${name}-${index}`}
          name={name}
          type={'hidden'}
          value={value}
        />
      ))}
      {children}
      {/* The no-JS path: the selects auto-submit only when JS is available, so
          the button is hidden via `@media (scripting: enabled)`. */}
      <AdminButton
        className={styles.submit}
        type={'submit'}
        variant={'secondary'}
      >
        Filtrovat
      </AdminButton>
    </Form>
  )
}
