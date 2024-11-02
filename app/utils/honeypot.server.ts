import { Honeypot, SpamError } from "remix-utils/honeypot/server"

export const honeypot = new Honeypot({
  validFromFieldName: undefined,
  encryptionSeed: process.env.HONEYPOT_SECRET,
})

export const checkHoneypot = (formData: FormData) => {
  try {
    honeypot.check(formData)
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response("Invalid form.", { status: 400 })
    }

    throw error
  }
}
