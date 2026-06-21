import { getDonationConfirmationYear } from '~/utils/get-donation-confirmation-year'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

export function loader() {
  return {
    honeypotInputProps: getHoneypotInputProps(),
    year: getDonationConfirmationYear(),
  }
}
