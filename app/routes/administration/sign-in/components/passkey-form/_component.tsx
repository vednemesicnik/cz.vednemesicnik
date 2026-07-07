import { startAuthentication } from '@simplewebauthn/browser'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

import type { action as generateAuthenticationOptionsAction } from '~/routes/administration/sign-in/passkey/generate-authentication-options/_action'
import type { action as verifyAuthenticationResponseAction } from '~/routes/administration/sign-in/passkey/verify-authentication-response/_action'
import { useBiometric } from '~/utils/use-biometric'

import styles from '../../_styles.module.css'

const ERROR_MESSAGE =
  'Přihlášení pomocí passkey se nezdařilo. Zkuste to prosím znovu.'

export const PasskeyForm = () => {
  const { isBiometricSupported } = useBiometric()

  const generateAuthenticationOptionsFetcher =
    useFetcher<typeof generateAuthenticationOptionsAction>()
  const verifyAuthenticationResponseFetcher =
    useFetcher<typeof verifyAuthenticationResponseAction>()

  const [error, setError] = useState<string | null>(null)

  const options = generateAuthenticationOptionsFetcher.data?.options ?? null

  // Once the server returns the challenge, run the authenticator ceremony and
  // POST the assertion for verification. A successful verify redirects into the
  // administration (session created server-side), so there is no success branch
  // to handle here.
  useEffect(() => {
    if (options === null) {
      return
    }

    const authenticate = async () => {
      try {
        const authenticationResponse = await startAuthentication({
          optionsJSON: options,
        })

        verifyAuthenticationResponseFetcher.submit(
          JSON.stringify(authenticationResponse),
          {
            action:
              '/administration/sign-in/passkey/verify-authentication-response',
            encType: 'application/json',
            method: 'POST',
          },
        )
      } catch {
        // User dismissed the prompt or no matching passkey was available.
        setError(ERROR_MESSAGE)
      }
    }

    void authenticate()
  }, [options, verifyAuthenticationResponseFetcher])

  const isVerifyFailed =
    verifyAuthenticationResponseFetcher.data?.verified === false

  useEffect(() => {
    if (isVerifyFailed) {
      setError(ERROR_MESSAGE)
    }
  }, [isVerifyFailed])

  // Passkey sign-in relies on a platform authenticator; hide the option when
  // the device can't offer one.
  if (!isBiometricSupported) {
    return null
  }

  const GenerateAuthenticationOptionsForm =
    generateAuthenticationOptionsFetcher.Form

  const isPending =
    generateAuthenticationOptionsFetcher.state !== 'idle' ||
    verifyAuthenticationResponseFetcher.state !== 'idle'

  return (
    <>
      <GenerateAuthenticationOptionsForm
        action={
          '/administration/sign-in/passkey/generate-authentication-options'
        }
        className={styles.googleForm}
        method={'post'}
        onSubmit={() => setError(null)}
      >
        <button
          className={styles.googleButton}
          disabled={isPending}
          type={'submit'}
        >
          Přihlásit pomocí passkey
        </button>
      </GenerateAuthenticationOptionsForm>

      {error !== null ? (
        <p className={styles.error} role={'alert'}>
          {error}
        </p>
      ) : null}
    </>
  )
}
