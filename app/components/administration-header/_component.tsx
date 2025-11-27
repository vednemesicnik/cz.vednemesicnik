import type { ReactNode } from "react"
import { href } from "react-router"

import { BaseLink } from "~/components/base-link"
import { VdmLogo } from "~/components/vdm-logo"

import styles from "./_styles.module.css"

type Props = {
  children?: ReactNode
}

export const AdministrationHeader = ({ children }: Props) => {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <BaseLink to={href("/administration")} className={styles.logoLink}>
          <VdmLogo className={styles.logo} variant={"admin"} />
          <p className={styles.title}>Administrace</p>
        </BaseLink>
        {children}
      </div>
    </header>
  )
}
