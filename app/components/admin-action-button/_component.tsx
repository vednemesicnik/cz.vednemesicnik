import { clsx } from "clsx"
import type { ComponentProps } from "react"

import type { AuthorPermissionAction } from "@generated/prisma/enums"
import { BaseButton } from "~/components/base-button"

import styles from "./_styles.module.css"

type Props = ComponentProps<"button"> & {
  action: keyof Pick<
    typeof AuthorPermissionAction,
    "publish" | "retract" | "archive" | "restore" | "delete"
  >
}

export const AdminActionButton = ({
  children,
  className,
  action,
  ...rest
}: Props) => (
  <BaseButton
    className={clsx(
      action === "publish" && styles.publish,
      action === "retract" && styles.retract,
      action === "archive" && styles.archive,
      action === "restore" && styles.restore,
      action === "delete" && styles.delete,
      className
    )}
    {...rest}
  >
    {children}
  </BaseButton>
)
