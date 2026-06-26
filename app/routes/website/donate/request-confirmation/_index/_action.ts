import { randomInt } from 'node:crypto'
import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, replace } from 'react-router'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { formatRetryAfter } from './utils/format-retry-after'

const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const makeRequestId = (year: string) => {
  let code = ''
  for (let i = 0; i < 6; i++) code += ID_ALPHABET[randomInt(ID_ALPHABET.length)]
  return `${year}-${code}`
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData()

  const limited = context.get(rateLimitContext)
  if (limited) {
    const submission = parseWithZod(formData, { schema })
    return data(
      submission.reply({
        formErrors: [
          `Příliš mnoho požadavků. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
        ],
      }),
      { status: 429 },
    )
  }

  checkHoneypot(formData)

  const submission = parseWithZod(formData, { schema })
  if (submission.status !== 'success') {
    return submission.reply()
  }

  const formValues = submission.value
  const requestId = makeRequestId(formValues.year)

  const GAS_URL = process.env.GAS_DONATION_CONFIRMATION_URL
  const GAS_SECRET = process.env.GAS_DONATION_CONFIRMATION_SECRET

  const donorFields =
    formValues.type === 'individual'
      ? {
          dateOfBirth: formValues.dateOfBirth,
          firstName: formValues.firstName,
          lastName: formValues.lastName,
        }
      : formValues.type === 'sole_trader'
        ? {
            firstName: formValues.firstName,
            ico: formValues.ico,
            lastName: formValues.lastName,
          }
        : {
            companyName: formValues.companyName,
            ico: formValues.ico,
          }

  const payload = {
    accounts: formValues.accounts
      .map((account) => account.trim())
      .filter(Boolean)
      .join(','),
    city: formValues.address.city,
    email: formValues.email,
    note: formValues.note ?? '',
    requestId,
    secret: GAS_SECRET,
    street: formValues.address.street,
    type: formValues.type,
    zip: formValues.address.zip.replace(/\s/g, ''),
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
