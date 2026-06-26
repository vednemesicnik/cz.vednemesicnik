import { getHoneypotInputProps } from '~/utils/honeypot.server'

export function loader() {
  const honeypotInputProps = getHoneypotInputProps()
  const requestableYears = [1, 2, 3].map((offset) =>
    String(new Date().getFullYear() - offset),
  )

  return { honeypotInputProps, requestableYears }
}
