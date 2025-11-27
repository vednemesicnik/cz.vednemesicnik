import { honeypot } from "~/utils/honeypot.server"

export const loader = async () => {
  const honeypotInputProps = honeypot.getInputProps()

  return {
    honeypotInputProps,
  }
}
