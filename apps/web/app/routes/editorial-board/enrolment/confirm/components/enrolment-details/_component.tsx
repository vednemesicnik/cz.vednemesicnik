import styles from './_styles.module.css'

type Props = {
  email: string
  interest?: string
  name: string
  phone?: string
}

/**
 * What the person is confirming (design 15e-confirm). The phone and the interest show
 * only when they were filled in.
 */
export const EnrolmentDetails = ({ email, interest, name, phone }: Props) => (
  <dl className={styles.details}>
    <div className={styles.detail}>
      <dt className={styles.term}>Jméno a příjmení</dt>
      <dd className={styles.value}>{name}</dd>
    </div>

    <div className={styles.detail}>
      <dt className={styles.term}>E-mail</dt>
      <dd className={styles.value}>{email}</dd>
    </div>

    {phone !== undefined && (
      <div className={styles.detail}>
        <dt className={styles.term}>Telefon</dt>
        <dd className={styles.value}>{phone}</dd>
      </div>
    )}

    {interest !== undefined && (
      <div className={styles.detail}>
        <dt className={styles.term}>Čemu byste se chtěli věnovat</dt>
        <dd className={styles.value}>{interest}</dd>
      </div>
    )}
  </dl>
)
