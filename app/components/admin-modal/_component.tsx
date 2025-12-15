import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  ref: RefObject<HTMLDialogElement | null>
} & ComponentPropsWithoutRef<"dialog">

export const AdminDialog = ({ children, ref, ...dialogProps }: Props) => (
  <dialog ref={ref} className={styles.dialog} {...dialogProps}>
    {children}
  </dialog>
)
