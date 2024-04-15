import { CSRF, CSRFError } from "remix-utils/csrf/server"
import { createCookie } from "@remix-run/node"

const cookie = createCookie("csrf", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  secrets: process.env.SESSION_SECRET?.split(","),
  maxAge: 60 * 60 * 24, // 1 day
})

export const csrf = new CSRF({ cookie })

export const validateCSRF = async (formData: FormData, headers: Headers) => {
  try {
    await csrf.validate(formData, headers)
  } catch (error) {
    if (error instanceof CSRFError) {
      throw new Response("Invalid CSRF token", { status: 403 })
    }

    throw error
  }
}
