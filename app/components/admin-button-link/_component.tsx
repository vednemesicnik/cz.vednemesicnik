import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseButton } from '~/components/base-button'

import styles from './_styles.module.css'

type Props = ComponentProps<'button'>

export const AdminButtonLink = ({ children, className, ...rest }: Props) => (
  <BaseButton className={clsx(styles.buttonLink, className)} {...rest}>
    {children}
  </BaseButton>
)
