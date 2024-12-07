import { useAuthenticityToken } from "~/components/authenticity-token-provider"
import { formConfig } from "~/config/form-config"

type Props = {
  name?: string
}

export const AuthenticityTokenInput = ({
  name = formConfig.authenticityToken.name,
}: Props) => {
  const token = useAuthenticityToken()
  return <input type="hidden" name={name} value={token} />
}
