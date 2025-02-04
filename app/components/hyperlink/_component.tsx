import { combineClasses } from "@liborgabrhel/style-utils"
import { type ComponentProps, type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = Omit<ComponentProps<"a">, "href" | "rel" | "target"> & {
  to: string
  title?: string
  className?: string
  children: ReactNode
  hasIcon?: boolean
}

export const Hyperlink = ({
  to,
  title,
  className,
  children,
  hasIcon = true,
  ...rest
}: Props) => {
  return (
    <a
      href={to}
      className={combineClasses(styles.hyperlink, className)}
      title={title}
      target={"_blank"}
      rel="noreferrer"
      {...rest}
    >
      {children}
      {hasIcon && (
        <span className={styles.iconWrapper}>
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            viewBox={"0 -960 960 960"}
            className={styles.icon}
          >
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
          </svg>
        </span>
      )}
    </a>
  )
}
