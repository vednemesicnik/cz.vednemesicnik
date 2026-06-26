import { randomInt } from 'node:crypto'
import { parseWithZod } from '@conform-to/zod/v4'
import { href, replace } from 'react-router'
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

  const data = submission.value
  const requestId = makeRequestId(data.year)

  const GAS_URL = process.env.GAS_DONATION_CONFIRMATION_URL
  const GAS_SECRET = process.env.GAS_DONATION_CONFIRMATION_SECRET

  const donorFields =
    data.type === 'individual'
      ? {
          dateOfBirth: data.dateOfBirth,
          firstName: data.firstName,
          lastName: data.lastName,
        }
      : data.type === 'sole_trader'
        ? {
            firstName: data.firstName,
            ico: data.ico,
            lastName: data.lastName,
          }
        : {
            companyName: data.companyName,
            ico: data.ico,
          }

  const payload = {
    accounts: data.accounts
      .map((account) => account.trim())
      .filter(Boolean)
      .join(','),
    city: data.address.city,
    email: data.email,
    note: data.note ?? '',
    requestId,
    secret: GAS_SECRET,
    street: data.address.street,
    type: data.type,
    zip: data.address.zip.replace(/\s/g, ''),
    ...donorFields,
  }

  try {
    const res = await fetch(GAS_URL, {
      body: JSON.stringify(payload),
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

  return replace(`${href('/donate/request-confirmation/sent')}?${params}`)
}
