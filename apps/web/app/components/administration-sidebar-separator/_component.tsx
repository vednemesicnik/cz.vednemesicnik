import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  className?: string
}

/**
 * The rule between the content sections and the people ones (design 22a).
 *
 * @returns The `<hr>`
 */
export const AdministrationSidebarSeparator = ({ className }: Props) => {
  return <hr className={clsx(styles.separator, className)} />
}
