import styles from './_styles.module.css'

type Props = {
  isLoading: boolean
  src: string
}

export const DonationQrImage = ({ isLoading, src }: Props) => {
  return (
    <div className={styles.qrBorder}>
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Načítám QR kód"
          className={styles.qrLoader}
          role="status"
        >
          <span aria-hidden="true" className={styles.spinner} />
        </div>
      ) : (
        <img
          alt="QR kód pro platbu"
          className={styles.qrImage}
          height={200}
          src={src}
          width={200}
        />
      )}
    </div>
  )
}
