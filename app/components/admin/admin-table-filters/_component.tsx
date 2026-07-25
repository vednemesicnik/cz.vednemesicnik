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
  // would litter the URL with `?category=&tag=`. Submitting the cleaned form
  // data keeps the URL to the filters that are actually set. Without JS the
  // native submit still works — the parser drops the empty values server-side.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    for (const [name, value] of [...formData.entries()]) {
      if (value === '') {
        formData.delete(name)
      }
    }

    void submit(formData, { method: 'get' })
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
