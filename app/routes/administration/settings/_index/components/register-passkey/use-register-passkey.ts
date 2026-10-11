import { startRegistration } from '@simplewebauthn/browser'
import { useCallback, useEffect, useRef } from 'react'
import { href, useFetcher, useRevalidator } from 'react-router'

import type { action as generateRegistrationOptionsAction } from '~/routes/administration/settings/passkeys/generate-registration-options/_action'
import type { action as verifyRegistrationResponseAction } from '~/routes/administration/settings/passkeys/verify-registration-response/_action'
import { useBiometric } from '~/utils/use-biometric'

import {
  getRegistrationProblem,
  type RegistrationProblem,
} from './get-registration-problem'

export type PasskeyRegistration = {
  isBiometricSupported: boolean
  isPending: boolean
  start: () => void
}

/**
 * The passkey registration ceremony of the Passkey row (design 29a). The
 * page owns it, so both the row's `Přidat passkey` and the step after the
 * identity check (29d) can start it.
 *
 * @param onProblemChange - Shows the problem in the row's value column (29d),
 *   `null` clears it; pass a state setter, the effects depend on it.
 * @returns Whether the device can add a passkey, whether a ceremony runs, and
 *   `start`, which asks for the challenge and runs the ceremony.
 */
export const useRegisterPasskey = (
  onProblemChange: (problem: RegistrationProblem | null) => void,
): PasskeyRegistration => {
  const { isBiometricSupported } = useBiometric()
  const revalidator = useRevalidator()

  const generateRegistrationOptionsFetcher =
    useFetcher<typeof generateRegistrationOptionsAction>()
  const verifyRegistrationResponseFetcher =
    useFetcher<typeof verifyRegistrationResponseAction>()

  const generatedData = generateRegistrationOptionsFetcher.data
  const options =
    generatedData !== undefined && 'options' in generatedData
      ? generatedData.options
      : null

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
            action: href(
              '/administration/settings/passkeys/verify-registration-response',
            ),
            encType: 'application/json',
            method: 'POST',
          },
        )
      } catch (error) {
        onProblemChange(getRegistrationProblem(error))
      }
    }

    void register()
  }, [onProblemChange, options, verifyRegistrationResponseFetcher])

  const verifiedData = verifyRegistrationResponseFetcher.data
  const isVerified = verifiedData?.verified === true

  // Refresh the list once the new passkey is stored.
  useEffect(() => {
    if (isVerified) {
      void revalidator.revalidate()
    }
  }, [isVerified, revalidator])

  // The session aged past the recent-authentication window on this page.
  useEffect(() => {
    if (generatedData?.status === 'reauthenticate') {
      onProblemChange('reauthenticate')
    }
  }, [generatedData, onProblemChange])

  useEffect(() => {
    if (verifiedData === undefined || verifiedData.verified) {
      return
    }

    onProblemChange(
      verifiedData.status === 'reauthenticate' ? 'reauthenticate' : 'failed',
    )
  }, [onProblemChange, verifiedData])

  const { submit } = generateRegistrationOptionsFetcher

  const start = useCallback(() => {
    onProblemChange(null)
    void submit(null, {
      action: href(
        '/administration/settings/passkeys/generate-registration-options',
      ),
      method: 'POST',
    })
  }, [onProblemChange, submit])

  return {
    isBiometricSupported,
    isPending:
      generateRegistrationOptionsFetcher.state !== 'idle' ||
      verifyRegistrationResponseFetcher.state !== 'idle',
    start,
  }
}
