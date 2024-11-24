import { redirect } from "@remix-run/node"

export const validateEntry = (...args: boolean[]) => {
  const hasSomeValidEntry = args.includes(true)

  if (!hasSomeValidEntry) {
    throw redirect("/administration")
  }
}
