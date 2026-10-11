import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { useEffect, useState } from 'react'

/**
 * Whether this browser can use passkeys at all (WebAuthn). Any passkey
 * counts — built-in, a phone via QR code or a security key — so a computer
 * without a fingerprint reader or Windows Hello still offers them (#571).
 *
 * @returns `isPasskeySupported`, `false` until the page hydrates.
 */
export const usePasskeySupport = () => {
  const [isPasskeySupported, setIsPasskeySupported] = useState(false)

  useEffect(() => {
    setIsPasskeySupported(browserSupportsWebAuthn())
  }, [])

  return {
    isPasskeySupported,
  }
}
