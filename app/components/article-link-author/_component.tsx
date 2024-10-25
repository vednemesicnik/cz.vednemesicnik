import { type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  imageSrc: string
  imageAlt: string
}

export const ArticleLinkAuthor = ({ children, imageSrc, imageAlt }: Props) => {
  return (
    <section className={styles.container}>
      <img src={imageSrc} alt={imageAlt} width={20} height={20} />
      <p className={styles.paragraph}>{children}</p>
    </section>
  )
}
