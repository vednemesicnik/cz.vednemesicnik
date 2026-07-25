import type { ReactNode } from 'react'
import { Form } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  preservedParams: [string, string][]
}

export const AdminTableFilters = ({ children, preservedParams }: Props) => {
  return (
    <Form className={styles.form} method={'get'}>
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
      {/* Also the no-JS path: the selects auto-submit only when JS is available. */}
      <AdminButton type={'submit'} variant={'secondary'}>
        Filtrovat
      </AdminButton>
    </Form>
  )
}
