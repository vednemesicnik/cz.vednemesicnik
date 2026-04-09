import crypto from 'node:crypto'

const SEPARATOR = '.'
const ENCODING = 'base64url'
const MINIMUM_MS = 500

const honeypotSecret = process.env.HONEYPOT_SECRET ?? ''

const HONEYPOT_FIELD_NAME = 'name__confirm'
const VALID_FROM_FIELD_NAME = 'from__confirm'

function sign(value: string) {
  return crypto
    .createHmac('sha256', honeypotSecret)
    .update(value)
    .digest(ENCODING)
}

function signTimestamp(timestamp: number): string {
  const value = String(timestamp)
  return [value, sign(value)].join(SEPARATOR)
}

function verifyAndGetTimestamp(signed: string): number | null {
  const [value, signature] = signed.split(SEPARATOR)
  if (sign(value) !== signature) return null
  return Number(value)
}

export const getHoneypotInputProps = () => ({
  encryptedValidFrom: signTimestamp(Date.now()),
  nameFieldName: HONEYPOT_FIELD_NAME,
  validFromFieldName: VALID_FROM_FIELD_NAME,
})

export const checkHoneypot = (formData: FormData) => {
  const nameValue = formData.get(HONEYPOT_FIELD_NAME)
  if (nameValue !== '' && nameValue !== null) {
    throw new Response('Invalid form.', { status: 400 })
  }

  const signed = formData.get(VALID_FROM_FIELD_NAME)
  if (typeof signed !== 'string') {
    throw new Response('Invalid form.', { status: 400 })
  }

  const timestamp = verifyAndGetTimestamp(signed)
  if (timestamp === null || Date.now() - timestamp < MINIMUM_MS) {
    throw new Response('Invalid form.', { status: 400 })
  }
}
