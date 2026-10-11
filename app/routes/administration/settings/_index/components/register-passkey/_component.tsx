import { Button } from '~/components/button'

import styles from './_styles.module.css'
import type { PasskeyRegistration } from './use-register-passkey'

type Props = {
  // The page's registration ceremony (`useRegisterPasskey`).
  registration: PasskeyRegistration
  // Whether this session may still change sign-in methods without another identity check.
  isRecentlyAuthenticated: () => boolean
  // Opens the identity check (design 29d).
  onRequireIdentityCheck: () => void
}

export const RegisterPasskey = ({
  registration,
  isRecentlyAuthenticated,
  onRequireIdentityCheck,
}: Props) => {
  if (!registration.isBiometricSupported) {
    return (
      <p className={styles.unsupported}>
        Na tomto zařízení nelze přidat passkey. Zkuste jiné zařízení.
      </p>
    )
  }

  // A stale session goes through the identity check before the ceremony starts.
  const handleClick = () => {
    if (!isRecentlyAuthenticated()) {
      onRequireIdentityCheck()
      return
    }

    registration.start()
  }

  return (
    <Button
      disabled={registration.isPending}
      onClick={handleClick}
      size={'sm'}
      type={'button'}
      variant={'outline'}
    >
      Přidat passkey
    </Button>
  )
}
