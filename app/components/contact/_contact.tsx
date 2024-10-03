import styles from "./_contact.module.css"

type Props = {
  label: string
  email: string
}

export const Contact = ({ label, email }: Props) => {
  return (
    <section className={styles.container}>
      <h2 className={styles.label}>{label}</h2>
      <a href={`mailto:${email}`} className={styles.link}>
        {email}
      </a>
    </section>
  )
}
