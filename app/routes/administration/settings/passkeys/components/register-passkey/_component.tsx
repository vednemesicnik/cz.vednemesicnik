import { startRegistration } from '@simplewebauthn/browser'
import { useEffect, useRef, useState } from 'react'
import { href, Link, useFetcher, useRevalidator } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import type { action as generateRegistrationOptionsAction } from '~/routes/administration/settings/passkeys/generate-registration-options/_action'
import type { action as verifyRegistrationResponseAction } from '~/routes/administration/settings/passkeys/verify-registration-response/_action'
import { useBiometric } from '~/utils/use-biometric'

import {
  getRegistrationProblem,
  type RegistrationProblem,
} from './get-registration-problem'

const PROBLEM_MESSAGES: Record<RegistrationProblem, string> = {
  'already-registered':
    'Použijte stávající passkey — toto zařízení už má passkey k tomuto účtu.',
  failed: 'Zkuste passkey přidat znovu — přidání se nepovedlo.',
  reauthenticate: 'Před přidáním passkey se znovu ověřte.',
}

const VERIFY_IDENTITY_URL = `${href('/administration/settings/verify-identity')}?${new URLSearchParams(
  { redirectTo: href('/administration/settings/passkeys') },
)}`

export const RegisterPasskey = () => {
  const { isBiometricSupported } = useBiometric()
  const revalidator = useRevalidator()

  const generateRegistrationOptionsFetcher =
    useFetcher<typeof generateRegistrationOptionsAction>()
  const verifyRegistrationResponseFetcher =
    useFetcher<typeof verifyRegistrationResponseAction>()

  const [problem, setProblem] = useState<RegistrationProblem | null>(null)

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
            action:
              '/administration/settings/passkeys/verify-registration-response',
            encType: 'application/json',
            method: 'POST',
          },
        )
      } catch (error) {
        setProblem(getRegistrationProblem(error))
      }
    }

    void register()
  }, [options, verifyRegistrationResponseFetcher])

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
      setProblem('reauthenticate')
    }
  }, [generatedData])

  useEffect(() => {
    if (verifiedData === undefined || verifiedData.verified) {
      return
    }

    setProblem(
      verifiedData.status === 'reauthenticate' ? 'reauthenticate' : 'failed',
    )
  }, [verifiedData])

  if (!isBiometricSupported) {
    return <p>Na tomto zařízení nelze přidat passkey. Zkuste jiné zařízení.</p>
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
          '/administration/settings/passkeys/generate-registration-options'
        }
        method={'post'}
        onSubmit={() => setProblem(null)}
      >
        <AdminButton disabled={isPending} type={'submit'}>
          Přidat passkey
        </AdminButton>
      </GenerateRegistrationOptionsForm>

      {problem !== null ? (
        <p role={'alert'}>
          {PROBLEM_MESSAGES[problem]}
          {problem === 'reauthenticate' ? (
            <>
              {' '}
              <Link to={VERIFY_IDENTITY_URL}>Ověřit</Link>
            </>
          ) : null}
        </p>
      ) : null}
    </>
  )
}
