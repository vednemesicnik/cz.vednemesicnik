import styles from "./_administration-panel.module.css"
import { getUserImageSrc } from "~/utils/get-user-image-src"
import { User } from "./components/user"
import { Navigation } from "./components/navigation"

export type AdministrationPanelUser = {
  name: string | undefined
  email: string | undefined
  image: {
    id: string | undefined
    altText: string | undefined
  }
}

type Props = {
  user: AdministrationPanelUser
}

export const AdministrationPanel = ({ user }: Props) => {
  const userImageSrc = user.image.id !== undefined ? getUserImageSrc(user.image.id) : undefined
  const userImageAlt = user.image.altText ?? "Obrázek uživatele"
  const name = user.email ?? "Neznámý uživatel"

  return (
    <section className={styles.container}>
      <User name={name} imageSrc={userImageSrc} imageAlt={userImageAlt} />
      <Navigation />
    </section>
  )
}
