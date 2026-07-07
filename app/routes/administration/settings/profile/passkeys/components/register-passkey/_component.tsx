import { startRegistration } from '@simplewebauthn/browser'
import { useEffect, useRef, useState } from 'react'
import { useFetcher, useRevalidator } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import type { action as generateRegistrationOptionsAction } from '~/routes/administration/settings/profile/passkeys/generate-registration-options/_action'
import type { action as verifyRegistrationResponseAction } from '~/routes/administration/settings/profile/passkeys/verify-registration-response/_action'
import { useBiometric } from '~/utils/use-biometric'

const ERROR_MESSAGE = 'Registrace passkey se nezdařila. Zkuste to prosím znovu.'

export const RegisterPasskey = () => {
  const { isBiometricSupported } = useBiometric()
  const revalidator = useRevalidator()

  const generateRegistrationOptionsFetcher =
    useFetcher<typeof generateRegistrationOptionsAction>()
  const verifyRegistrationResponseFetcher =
    useFetcher<typeof verifyRegistrationResponseAction>()

  const [error, setError] = useState<string | null>(null)

  const options = generateRegistrationOptionsFetcher.data?.options ?? null

  // Tracks the challenge already handed to the authenticator so re-renders
  // (fetcher state changes, revalidation) don't re-run the ceremony.
  const startedOptionsRef = useRef<typeof options>(null)

  // Once the server returns the challenge, run the authenticator ceremony and
  // POST the attestation for verification (which persists the Passkey row).
  useEffect(() => {
    if (options === null) {
      return
    }

    if (startedOptionsRef.current === options) {
      return
    }
    startedOptionsRef.current = options

    const register = async () => {
      try {
        const registrationResponse = await startRegistration({
          optionsJSON: options,
        })

        verifyRegistrationResponseFetcher.submit(
          JSON.stringify(registrationResponse),
          {
            action:
              '/administration/settings/profile/passkeys/verify-registration-response',
            encType: 'application/json',
            method: 'POST',
          },
        )
      } catch {
        // User dismissed the prompt or the authenticator is already enrolled.
        setError(ERROR_MESSAGE)
      }
    }

    void register()
  }, [options, verifyRegistrationResponseFetcher])

  const isVerified = verifyRegistrationResponseFetcher.data?.verified === true
  const isVerifyFailed =
    verifyRegistrationResponseFetcher.data?.verified === false

  // Refresh the list once the new passkey is stored.
  useEffect(() => {
    if (isVerified) {
      void revalidator.revalidate()
    }
  }, [isVerified, revalidator])

  useEffect(() => {
    if (isVerifyFailed) {
      setError(ERROR_MESSAGE)
    }
  }, [isVerifyFailed])

  if (!isBiometricSupported) {
    return <p>Toto zařízení nepodporuje passkeys (platform authenticator).</p>
  }

  const GenerateRegistrationOptionsForm =
    generateRegistrationOptionsFetcher.Form

  const isPending =
    generateRegistrationOptionsFetcher.state !== 'idle' ||
    verifyRegistrationResponseFetcher.state !== 'idle'

  return (
    <>
      <GenerateRegistrationOptionsForm
        action={
          '/administration/settings/profile/passkeys/generate-registration-options'
        }
        method={'post'}
        onSubmit={() => setError(null)}
      >
        <AdminButton disabled={isPending} type={'submit'}>
          Přidat passkey
        </AdminButton>
      </GenerateRegistrationOptionsForm>

      {error !== null ? <p role={'alert'}>{error}</p> : null}
    </>
  )
}
