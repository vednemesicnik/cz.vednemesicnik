import styles from './_administration-panel.module.css'
import { Navigation } from './components/navigation'
import { User } from './components/user'

export type AdministrationPanelUser = {
  name: string | undefined
  email: string | undefined
  image: {
    src: string | undefined
    altText: string | undefined
  }
}

type Props = {
  user: AdministrationPanelUser
}

export const AdministrationPanel = ({ user }: Props) => {
  const userImageSrc = user.image.src
  const userImageAlt = user.image.altText ?? 'Obrázek uživatele'
  const name = user.email ?? 'Neznámý uživatel'

  return (
    <section className={styles.container}>
      <User imageAlt={userImageAlt} imageSrc={userImageSrc} name={name} />
      <Navigation />
    </section>
  )
}
