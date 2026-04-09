import { getHoneypotInputProps } from '~/utils/honeypot.server'

export const loader = async () => {
  const honeypotInputProps = getHoneypotInputProps()

  return {
    honeypotInputProps,
  }
}
