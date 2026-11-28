import type { RunningVersion } from '../../auth/environment.server.ts'

const REPOSITORY = 'https://github.com/vednemesicnik/cz.vednemesicnik'

/**
 * Where the version line links (`31a`): a release's notes, or the page of the one commit when no
 * tag stands for it.
 *
 * @returns The value shown after _Verze_ and its page, or `null` for a development build.
 */
export function versionLink(version: RunningVersion): { href: string; value: string } | null {
  if (version.kind === 'release') {
    return { href: `${REPOSITORY}/releases/tag/${version.tag}`, value: version.version }
  }
  if (version.kind === 'commit') {
    return { href: `${REPOSITORY}/commit/${version.commit}`, value: version.commit }
  }
  return null
}
