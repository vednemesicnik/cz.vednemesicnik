import { startRegistration } from "@simplewebauthn/browser"
import { useEffect } from "react"
import { useFetcher, useNavigate } from "react-router"
import { HoneypotInputs } from "remix-utils/honeypot/react"

import { Modal } from "~/components/modal"
import { type action as generateRegistrationOptionsAction } from "~/routes/administration/authentication/generate-registration-options/_action"
import { type action as verifyRegistrationResponseAction } from "~/routes/administration/authentication/verify-registration-response/_action"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const BiometricModal = ({ isOpen, onClose }: Props) => {
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
            action: "/administration/sign-in/verify",
            method: "POST",
            encType: "application/json",
          })
        }

        verifyRegistrationResponse(JSON.stringify(registrationResponse))
      }

      void register()
    }
  }, [options, onClose, verifyRegistrationResponseFetcher])

  const navigate = useNavigate()
  const isVerified = verifyRegistrationResponseFetcher.data?.verified ?? false

  useEffect(() => {
    if (isVerified) {
      navigate("/administration", { replace: true })
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={"use-biometric-modal-title"}
    >
      <h3 id={"use-biometric-modal-title"}>Přihlásit se pomocí biometrie</h3>
      <p>
        Pro zvýšení bezpečnosti můžete použít biometrické autentizační
        prostředky.
      </p>
      <button onClick={onClose} type={"button"}>
        Zavřít
      </button>
      <GenerateRegistrationOptionsForm
        onSubmit={onClose}
        method={"post"}
        action={"/administration/sign-in/generate-registration-options"}
      >
        <HoneypotInputs />

        <button type={"submit"}>Přidat biometrickou autentizaci</button>
      </GenerateRegistrationOptionsForm>
    </Modal>
  )
}
