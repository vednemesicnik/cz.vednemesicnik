/**
 * One bounded line about a failed call to Google. The text can come from Google, so control
 * characters go and the length is capped; no token is ever passed in.
 */
export function logDriveFailure(what: string, message: string): void {
  let line = [...message]
    .map((char) => {
      let code = char.codePointAt(0) ?? 0
      return code < 0x20 || (code >= 0x7f && code <= 0x9f) ? ' ' : char
    })
    .join('')
    .slice(0, 200)
  console.error(`[drive] ${what}: ${line}`)
}
