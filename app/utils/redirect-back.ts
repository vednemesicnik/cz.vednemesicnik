import { redirect } from "react-router";

type Options = ResponseInit & {
  fallbackUrl?: string
}
export const redirectBack = (request: Request, options: Options) => {
  const { fallbackUrl = "/", ...init } = options

  return redirect(request.headers.get("Referer") ?? fallbackUrl, init)
}
