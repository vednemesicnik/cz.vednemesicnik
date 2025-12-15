import { useAuthenticityToken } from "~/components/authenticity-token-provider"
import { FORM_CONFIG } from "~/config/form-config"

type Props = {
  name?: string
}

export const AuthenticityTokenInput = ({
  name = FORM_CONFIG.authenticityToken.name,
}: Props) => {
  const token = useAuthenticityToken()
  return <input type="hidden" name={name} value={token} />
}
