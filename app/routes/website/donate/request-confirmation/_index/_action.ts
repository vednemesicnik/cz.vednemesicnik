import { randomInt } from 'node:crypto'
import { parseWithZod } from '@conform-to/zod/v4'
import { href, redirect } from 'react-router'
import { getDonationConfirmationYear } from '~/utils/get-donation-confirmation-year'
import { checkHoneypot } from '~/utils/honeypot.server'
import { schema } from './_schema'
import type { Route } from './+types/route'

const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const makeRequestId = (year: string) => {
  let code = ''
  for (let i = 0; i < 6; i++) code += ID_ALPHABET[randomInt(ID_ALPHABET.length)]
  return `${year}-${code}`
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  checkHoneypot(formData)

  const submission = parseWithZod(formData, { schema })
  if (submission.status !== 'success') {
    return submission.reply()
  }

  const year = String(getDonationConfirmationYear())
  const requestId = makeRequestId(year)
  const {
    street,
    postalCode,
    city,
    country,
    accounts: accountList,
    ...rest
  } = submission.value
  const postalCodeNormalized = postalCode
    .replace(/\s/g, '')
    .replace(/(\d{3})(\d{2})/, '$1 $2')
  const address = `${street}\n${postalCodeNormalized} ${city}\n${country}`
  const accounts = accountList
    .map((account) => account.trim())
    .filter(Boolean)
    .join('\n')

  const GAS_URL = process.env.GAS_DONATION_CONFIRMATION_URL
  const GAS_SECRET = process.env.GAS_DONATION_CONFIRMATION_SECRET

  try {
    const res = await fetch(GAS_URL, {
      body: JSON.stringify({
        ...rest,
        accounts,
        address,
        requestId,
        secret: GAS_SECRET,
        year,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = (await res.json().catch(() => ({ ok: false }))) as {
      ok?: boolean
    }
    if (!res.ok || !result.ok) {
      return submission.reply({
        formErrors: ['Žádost se nepodařilo odeslat. Zkuste to prosím znovu.'],
      })
    }
  } catch {
    return submission.reply({
      formErrors: ['Server je dočasně nedostupný. Zkuste to prosím za chvíli.'],
    })
  }

  const params = new URLSearchParams({ id: requestId })

  return redirect(`${href('/donate/request-confirmation/sent')}?${params}`)
}
