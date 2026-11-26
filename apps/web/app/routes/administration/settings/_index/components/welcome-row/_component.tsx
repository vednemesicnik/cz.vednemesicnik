import { Banner, BannerActions, BannerContent } from '~/components/banner'
import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = {
  // Starts adding a passkey; absent in a browser without WebAuthn.
  onAddPasskey?: () => void
  isAddingPasskey: boolean
  onDismiss: () => void
}

/**
 * The welcome row at the top of Settings after an invitation (design 29e):
 * how to sign in next time, and a passkey on offer. „Už nezobrazovat“ closes
 * it for good; in a browser without passkeys only the first sentence stays.
 */
export const WelcomeRow = ({
  onAddPasskey,
  isAddingPasskey,
  onDismiss,
}: Props) => (
  <Banner className={styles.welcome}>
    <BannerContent className={styles.content}>
      <span className={styles.title}>Vítejte v administraci</span>
      <span className={styles.text}>
        Příště se přihlásíte přes Google s adresou @vednemesicnik.cz nebo
        odkazem v e-mailu.
        {onAddPasskey !== undefined &&
          ' Můžete si také přidat passkey pro přihlášení odemknutím zařízení nebo bezpečnostního klíče.'}
      </span>
    </BannerContent>
    <BannerActions className={styles.actions}>
      {onAddPasskey !== undefined && (
        <Button
          disabled={isAddingPasskey}
          onClick={onAddPasskey}
          size={'sm'}
          type={'button'}
        >
          Přidat passkey
        </Button>
      )}
      {/* Outline beside the passkey button and alone (29e, oyeh9r6r). */}
      <Button
        onClick={onDismiss}
        size={'sm'}
        type={'button'}
        variant={'outline'}
      >
        Už nezobrazovat
      </Button>
    </BannerActions>
  </Banner>
)
