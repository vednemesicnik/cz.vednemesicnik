const PREFIX = 'PUBLIKACE_'

/** The record `createPublikace` reads its configuration from, by its own names. */
export type PublikaceEnvironment = Readonly<Record<string, string | undefined>>

/** Publikace's record, or why the host does not start Publikace at all. */
export type PublikaceEnvironmentResult =
  | { environment: PublikaceEnvironment; refusal: null }
  | { environment: null; refusal: string }

/**
 * Builds Publikace's configuration from this process's environment.
 *
 * One Fly app has one namespace of secrets, and the web already uses names Publikace reads
 * (`SESSION_SECRET`, `GOOGLE_CLIENT_ID`), so every Publikace variable is set as
 * `PUBLIKACE_<name>` and handed over as `<name>`. Nothing else of this process reaches it.
 * `NODE_ENV` is the one value both apps share; it comes from this process, never from a
 * `PUBLIKACE_NODE_ENV`, because every production guard in Publikace hangs on it.
 *
 * On Fly (`FLY_APP_NAME` is set) anything but `production` is refused: Publikace outside
 * production accepts a public session secret and any token audience.
 *
 * @param processEnvironment This process's `process.env`.
 * @returns The record, or the reason to refuse.
 */
export function publikaceEnvironment(
  processEnvironment: Readonly<Record<string, string | undefined>>,
): PublikaceEnvironmentResult {
  const nodeEnvironment = processEnvironment.NODE_ENV

  if (processEnvironment.FLY_APP_NAME && nodeEnvironment !== 'production') {
    return {
      environment: null,
      refusal: `NODE_ENV is ${nodeEnvironment ?? 'unset'} on Fly, not production`,
    }
  }

  const environment: Record<string, string | undefined> = {}

  for (const [name, value] of Object.entries(processEnvironment)) {
    if (name.startsWith(PREFIX)) environment[name.slice(PREFIX.length)] = value
  }

  environment.NODE_ENV = nodeEnvironment

  return { environment, refusal: null }
}
