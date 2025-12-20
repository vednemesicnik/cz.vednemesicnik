import { startRegistration } from '@simplewebauthn/browser'
import { useEffect } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import { HoneypotInputs } from 'remix-utils/honeypot/react'

import type { action as generateRegistrationOptionsAction } from '~/routes/administration/authentication/generate-registration-options/_action'
import type { action as verifyRegistrationResponseAction } from '~/routes/administration/authentication/verify-registration-response/_action'

type Props = {
  onClose: () => void
}

export const BiometricModal = ({ onClose }: Props) => {
  const generateRegistrationOptionsFetcher =
    useFetcher<typeof generateRegistrationOptionsAction>()
  const verifyRegistrationResponseFetcher =
    useFetcher<typeof verifyRegistrationResponseAction>()

  console.log({ generateRegistrationOptionsFetcher })

  const options = generateRegistrationOptionsFetcher.data?.options ?? null

  useEffect(() => {
    if (options !== null) {
      const register = async () => {
        const registrationResponse = await startRegistration({
          optionsJSON: options,
        })

        const verifyRegistrationResponse = (registrationResponse: string) => {
          verifyRegistrationResponseFetcher.submit(registrationResponse, {
            action: '/administration/sign-in/verify',
            encType: 'application/json',
            method: 'POST',
          })
        }

        verifyRegistrationResponse(JSON.stringify(registrationResponse))
      }

      void register()
    }
  }, [options, verifyRegistrationResponseFetcher])

  const navigate = useNavigate()
  const isVerified = verifyRegistrationResponseFetcher.data?.verified ?? false

  useEffect(() => {
    if (isVerified) {
      navigate('/administration', { replace: true })
    }
  }, [isVerified, navigate])

  // useEffect(() => {
  //   if (authenticationOptions !== null) {
  //     const authenticate = async () => {
  //       const authenticationResponseJSON = await startAuthentication({
  //         optionsJSON: authenticationOptions,
  //       })
  //
  //       console.log({ authenticationResponseJSON })
  //     }
  //
  //     void authenticate()
  //   }
  // }, [authenticationOptions])

  const GenerateRegistrationOptionsForm =
    generateRegistrationOptionsFetcher.Form

  return (
    <>
      <h3 id={'use-biometric-modal-title'}>Přihlásit se pomocí biometrie</h3>
      <p>
        Pro zvýšení bezpečnosti můžete použít biometrické autentizační
        prostředky.
      </p>
      <button onClick={onClose} type={'button'}>
        Zavřít
      </button>
      <GenerateRegistrationOptionsForm
        action={'/administration/sign-in/generate-registration-options'}
        method={'post'}
        onSubmit={onClose}
      >
        <HoneypotInputs />

        <button type={'submit'}>Přidat biometrickou autentizaci</button>
      </GenerateRegistrationOptionsForm>
    </>
  )
}
