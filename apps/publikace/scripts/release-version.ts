import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/*
 * The version a pull request into `main` gives `main`, worked out the same way twice: by
 * `ci.yml` before the merge, so a wrong version blocks it, and by `release.yml` after it, which
 * tags the merge commit with the answer. One script, so the two cannot disagree.
 *
 * - A release (`dev → main`) names its version in the title, `chore(release): v0.4.0`, and it
 *   has to be the next patch, minor or major after the newest `v*` tag.
 * - A hotfix (any other head into `main`) is the next patch, without asking.
 * - A PR into anything else gets no version.
 *
 * **Below 1.0.0 until the app is on Fly.io.** A major of 1 or more is refused while the
 * repository has no `fly.toml`, so `v1.0.0` can only be the release that reaches production.
 * From there on `release.yml` also publishes each version on the GitHub Releases page.
 *
 * Reads `BASE_REF`, `HEAD_REF` and `TITLE`; writes `version`, `previous` and `is_stable` to
 * `$GITHUB_OUTPUT` when it runs in Actions. `node scripts/release-version.ts` runs it locally
 * with the same variables.
 */

type Version = { major: number; minor: number; patch: number }

const ROOT = join(import.meta.dirname, '..')

const TAG_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const RELEASE_TITLE_PATTERN = /^chore\(release\): (v\S+)$/

function main(): void {
  let base = process.env.BASE_REF ?? ''
  let head = process.env.HEAD_REF ?? ''
  let title = process.env.TITLE ?? ''

  if (base !== 'main') {
    console.log(`A PR into ${base || '(no base)'} gets no version.`)
    return
  }

  let previous = newestTag()
  let isRelease = head === 'dev'
  let next = isRelease ? releaseVersion(title, previous) : hotfixVersion(previous)

  let version = format(next)
  console.log(
    `${isRelease ? 'Release' : 'Hotfix'} ${version}` +
      (previous ? `, after ${format(previous)}.` : ', the first one.'),
  )

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${version}\nprevious=${previous ? format(previous) : ''}\n` +
        `is_stable=${next.major >= 1}\n`,
    )
  }
}

function releaseVersion(title: string, previous: Version | undefined): Version {
  let match = RELEASE_TITLE_PATTERN.exec(title)
  if (!match) {
    fail(
      `A release PR is titled with the version it ships, \`chore(release): v0.4.0\`.`,
      `This one is: ${title}`,
    )
  }

  let next = parse(match[1])
  if (!next) {
    fail(`${match[1]} is not a version: it reads vMAJOR.MINOR.PATCH, \`v0.4.0\`.`)
  }

  let allowed = previous
    ? [
        { ...previous, patch: previous.patch + 1 },
        { ...previous, minor: previous.minor + 1, patch: 0 },
        { major: previous.major + 1, minor: 0, patch: 0 },
      ]
    : [
        { major: 0, minor: 1, patch: 0 },
        { major: 1, minor: 0, patch: 0 },
      ]

  let name = format(next)
  if (!allowed.some((candidate) => format(candidate) === name)) {
    fail(
      `${name} does not follow ${previous ? format(previous) : 'an untagged main'}.`,
      `The next version is one of: ${allowed.map(format).join(', ')}.`,
    )
  }

  if (next.major >= 1 && !existsSync(join(ROOT, 'fly.toml'))) {
    fail(
      `${name} is a production version, and the repository has no fly.toml yet.`,
      'Until the app deploys to Fly.io a release stays below 1.0.0.',
    )
  }

  return next
}

function hotfixVersion(previous: Version | undefined): Version {
  if (!previous) {
    fail(
      'A hotfix patches a release, and main has none yet.',
      'The first version goes dev → main, titled `chore(release): v0.1.0`.',
    )
  }
  return { ...previous, patch: previous.patch + 1 }
}

/* Asked of the remote rather than of the checkout, because `actions/checkout` fetches no
   tags by default and a stale local tag would be the wrong answer anyway. */
function newestTag(): Version | undefined {
  let output = execFileSync('git', ['ls-remote', '--tags', '--refs', 'origin', 'refs/tags/v*'], {
    cwd: ROOT,
    encoding: 'utf8',
  })

  let versions = output
    .split('\n')
    .map((line) => line.split('refs/tags/')[1])
    .filter((tag) => tag !== undefined)
    .map(parse)
    .filter((version) => version !== undefined)

  return versions.sort(compare).at(-1)
}

function parse(tag: string): Version | undefined {
  let match = TAG_PATTERN.exec(tag)
  if (!match) return undefined
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
}

function compare(a: Version, b: Version): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch
}

function format(version: Version): string {
  return `v${version.major}.${version.minor}.${version.patch}`
}

function fail(...lines: string[]): never {
  console.error(lines.join('\n'))
  process.exit(1)
}

main()
