import { useEffect, useState } from "react"

export const useBiometric = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false)

  useEffect(() => {
    const checkBiometricSupport = async () => {
      const isSupported =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      setIsBiometricSupported(isSupported)
    }

    void checkBiometricSupport()
  }, [])

  return {
    isBiometricSupported,
  }
}
