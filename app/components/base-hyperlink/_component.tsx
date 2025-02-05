import { combineClasses } from "@liborgabrhel/style-utils"
import { type ComponentProps, type JSX } from "react"

import styles from "./_styles.module.css"

type Props = ComponentProps<"a">

/**
 * BaseHyperlink component renders an anchor (`<a>`) element with predefined styles.
 * It opens the link in a new tab and prevents referrer information from being sent.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be displayed inside the anchor element.
 * @param {string} [props.className] - Additional class names to apply to the anchor element.
 * @param {Object} [props.rest] - Additional properties to be passed to the anchor element.
 * @returns {JSX.Element} The rendered anchor element.
 */
export const BaseHyperlink = ({
  children,
  className,
  ...rest
}: Props): JSX.Element => {
  return (
    <a
      target={"_blank"}
      rel={"noreferrer"}
      className={combineClasses(styles.baseHyperlink, className)}
      {...rest}
    >
      {children}
    </a>
  )
}
