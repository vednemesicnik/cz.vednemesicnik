import styles from './_user.module.css'

type Props = {
  name: string
  imageSrc?: string
  imageAlt?: string
}

export const User = ({ name, imageSrc, imageAlt }: Props) => {
  return (
    <section className={styles.container}>
      {imageSrc !== undefined ? (
        <img alt={imageAlt} className={styles.user_avatar} src={imageSrc} />
      ) : null}
      {/*<img src={imageSrc} alt={imageAlt} className={styles.user_avatar} />*/}
      <span className={styles.user_name}>{name}</span>
    </section>
  )
}
