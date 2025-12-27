import type { ComponentProps } from 'react'

import { AdminRadioInputBase } from '~/components/admin-radio-input-base'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  errors?: string[]
  label: string
}

export const Radio = ({ errors, label, ...rest }: Props) => {
  return (
    <section className={styles.container}>
      <AdminRadioInputBase errors={errors} label={label} {...rest} />
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
