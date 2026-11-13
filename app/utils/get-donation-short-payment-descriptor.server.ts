import { DONATION_PAYMENT } from '~/data/donation-payment'
import { createShortPaymentDescriptor } from './create-short-payment-descriptor.server'

export const getDonationShortPaymentDescriptor = (request: Request): string => {
  const url = new URL(request.url)
  const amountParam = url.searchParams.get('amount')
  const amount = amountParam !== null ? Number(amountParam) : null

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    throw new Response('Neplatná částka', { status: 400 })
  }

  return createShortPaymentDescriptor({
    amount,
    bic: DONATION_PAYMENT.bic,
    currency: DONATION_PAYMENT.currency,
    iban: DONATION_PAYMENT.iban,
    message: DONATION_PAYMENT.message,
    name: DONATION_PAYMENT.name,
    variableSymbol: DONATION_PAYMENT.variableSymbol,
  })
}
