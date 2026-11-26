import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useSegmentedControl } from '~/components/segmented-control'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  value: string
  lang?: string
  className?: string
}

/**
 * One segment of a `SegmentedControl`: a native radio button under the
 * control's `name`, chosen when its value is the control's.
 *
 * @param props.children - The option's label, e.g. „Systém“
 * @param props.value - The value the form submits for it
 * @param props.lang - The label's language, where it is not the page's
 * @returns The segment's `<label>` with its radio button
 */
export const SegmentedControlOption = ({
  children,
  value,
  lang,
  className,
}: Props) => {
  const control = useSegmentedControl()

  return (
    <label className={clsx(styles.segment, className)} lang={lang}>
      <input
        checked={value === control.value}
        className={styles.input}
        name={control.name}
        onChange={control.onChange}
        type={'radio'}
        value={value}
      />
      {children}
    </label>
  )
}
