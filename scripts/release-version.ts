import { execFileSync, spawnSync } from 'node:child_process'
import { appendFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/*
 * The tag each application gets from a merge into `main`, worked out the same way twice: by
 * release-version.yml before the merge, so a wrong version blocks the PR, and by release.yml
 * after it, which tags the merge commit with the answer. One script, so the two cannot disagree.
 *
 * Every folder in apps/ has a style in RELEASE_STYLES, and its tags are `<folder>-<version>`:
 *
 * - `date` — the day of the merge in Prague, `web-2026-11-27`, then `web-2026-11-27-2`.
 * - `semver` — a release (`dev → main`) names the version under `## Versions` in its body,
 *   `- publikace-v1.1.0`, the next patch, minor or major after the newest tag. A hotfix (any
 *   other head) is the next patch, without asking. The first version is named, and it is always
 *   v1.0.0; until a release names it the application stays untagged.
 *
 * An application is tagged when its folder changed since its newest tag, or, with no tag yet,
 * in the commits this PR brings into `main`.
 *
 * Modes (`MODE`): `check-apps` checks the folders against the table (PRs into `dev`), `check`
 * is the gate (PRs into `main`), `release` writes `releases` to `$GITHUB_OUTPUT` for the job
 * that tags. Reads `BASE_REF`, `HEAD_REF`, `HEAD_REPO`, `REPO`, `BODY`, `SHA` and `MERGED_AT`.
 * Runs locally with the same variables: `MODE=check BASE_REF=main HEAD_REF=dev node
 * scripts/release-version.ts`.
 */

/** How an application names its versions. */
export type AppStyle = {
  /** Whether its Releases take the repository's one "Latest" badge. */
  latest: boolean
  style: 'date' | 'semver'
}

/** Every folder in apps/ and its style; a new application picks one here. */
export const RELEASE_STYLES: Record<string, AppStyle> = {
  publikace: { latest: false, style: 'semver' },
  web: { latest: true, style: 'date' },
}

/** A version named in a release PR's body. */
export type NamedVersion = { app: string; version: string }

/** What is known about one application at the commit being tagged. */
export type AppFacts = {
  app: string
  /** Whether apps/<app>/ changed since `previous`, or in this PR when there is none. */
  changed: boolean
  /** The day of the merge in Prague, `YYYY-MM-DD`. */
  date: string
  /** A tag of this application already on the commit: a re-run of a run that tagged. */
  existing: string | undefined
  kind: 'release' | 'hotfix'
  /** The versions the body names for this application, `1.1.0`. */
  named: string[]
  style: AppStyle
  /** This application's tags in the commit's history, not counting `existing`. */
  tags: string[]
}

/** What happens to one application. */
export type Decision =
  | { action: 'tag'; app: string; previous: string | undefined; tag: string }
  | { action: 'skip'; app: string; reason: string }
  | { action: 'fail'; app: string; reason: string }

type Semver = { major: number; minor: number; patch: number }

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const DATE = /^(\d{4}-\d{2}-\d{2})(?:-([1-9]\d*))?$/
const NAMED_LINE = /^[-*]\s+`?([a-z][a-z0-9-]*)-v(\S+?)`?\s*$/

/**
 * Reads the versions a release PR names: `- <app>-vX.Y.Z` lines under `## Versions`, with
 * HTML comments left out, so a template's instructions are never read as a version.
 *
 * @param body The PR body; GitHub sends `null` for an empty one.
 * @returns Each named version, in the order of the body.
 */
export function parseNamedVersions(
  body: string | null | undefined,
): NamedVersion[] {
  const text = (body ?? '').replace(/<!--[\s\S]*?-->/g, '')
  const named: NamedVersion[] = []
  let inSection = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (/^##\s/.test(line)) {
      inSection = /^##\s+Versions\s*$/i.test(line)
      continue
    }
    const match = inSection ? NAMED_LINE.exec(line) : null
    if (match) named.push({ app: match[1], version: match[2] })
  }

  return named
}

function parseSemver(version: string): Semver | undefined {
  const match = SEMVER.exec(version)
  if (!match) return undefined
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function formatSemver({ major, minor, patch }: Semver): string {
  return `${major}.${minor}.${patch}`
}

/**
 * The newest of an application's tags, by its style; tags of another shape are ignored.
 *
 * @param app The folder name, the tags' prefix.
 * @param style The application's style.
 * @param tags Tag names, in any order.
 * @returns The newest tag, or `undefined` when there is none.
 */
export function newestTag(
  app: string,
  style: AppStyle,
  tags: string[],
): string | undefined {
  const prefix = style.style === 'semver' ? `${app}-v` : `${app}-`
  const parsed = tags
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => ({ key: sortKey(style, tag.slice(prefix.length)), tag }))
    .filter((entry) => entry.key !== undefined)

  parsed.sort((a, b) => compareKeys(a.key ?? [], b.key ?? []))
  return parsed.at(-1)?.tag
}

function sortKey(style: AppStyle, version: string): number[] | undefined {
  if (style.style === 'semver') {
    const semver = parseSemver(version)
    return semver && [semver.major, semver.minor, semver.patch]
  }
  const match = DATE.exec(version)
  return match
    ? [Number(match[1].replaceAll('-', '')), Number(match[2] ?? 1)]
    : undefined
}

function compareKeys(a: number[], b: number[]): number {
  for (let index = 0; index < a.length; index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

/**
 * The tag of a date-style application for a merge on `date`: the day itself, or the day with
 * the next number when it already has a tag.
 *
 * @param app The folder name.
 * @param tags The application's tags.
 * @param date The day of the merge, `YYYY-MM-DD`.
 * @returns For example `web-2026-11-27`, then `web-2026-11-27-2`.
 */
export function nextDateTag(app: string, tags: string[], date: string): string {
  const numbers = tags
    .filter((tag) => tag.startsWith(`${app}-`))
    .map((tag) => DATE.exec(tag.slice(app.length + 1)))
    .filter((match) => match !== null && match[1] === date)
    .map((match) => Number(match?.[2] ?? 1))

  if (numbers.length === 0) return `${app}-${date}`
  return `${app}-${date}-${Math.max(...numbers) + 1}`
}

/**
 * The versions a semver application may take after `previous`.
 *
 * @param previous The newest version, `1.2.3`, or `undefined` before the first one.
 * @returns The next patch, minor and major, or the first version alone.
 */
export function allowedSemvers(previous: string | undefined): string[] {
  const last = previous === undefined ? undefined : parseSemver(previous)
  if (!last) return ['1.0.0']
  return [
    { ...last, patch: last.patch + 1 },
    { ...last, minor: last.minor + 1, patch: 0 },
    { major: last.major + 1, minor: 0, patch: 0 },
  ].map(formatSemver)
}

/**
 * Decides what one application gets from this merge.
 *
 * @param facts What is known about the application at the commit.
 * @returns A tag, a skip with its reason, or a failure that blocks the PR.
 */
export function decideRelease(facts: AppFacts): Decision {
  const { app, style } = facts
  const previous = newestTag(app, style, facts.tags)

  if (facts.existing) {
    return { action: 'tag', app, previous, tag: facts.existing }
  }

  if (style.style === 'date') {
    if (facts.named.length > 0) {
      return fail(app, `${app} is tagged by date and takes no named version.`)
    }
    if (!facts.changed) {
      return skip(
        app,
        previous ? `unchanged since ${previous}` : 'unchanged in this PR',
      )
    }
    return {
      action: 'tag',
      app,
      previous,
      tag: nextDateTag(app, facts.tags, facts.date),
    }
  }

  return decideSemver(facts, previous)
}

function decideSemver(facts: AppFacts, previous: string | undefined): Decision {
  const { app } = facts
  const previousVersion = previous?.slice(app.length + 2)
  const allowed = allowedSemvers(previousVersion)
  const list = allowed.map((version) => `${app}-v${version}`).join(', ')

  if (facts.kind === 'hotfix') {
    if (!previous) {
      return skip(app, 'no tag yet, and a hotfix gives no first version')
    }
    if (!facts.changed) return skip(app, `unchanged since ${previous}`)
    return { action: 'tag', app, previous, tag: `${app}-v${allowed[0]}` }
  }

  if (facts.named.length > 1) {
    return fail(app, `The body names ${facts.named.length} versions of ${app}.`)
  }
  const [named] = facts.named

  if (!previous) {
    if (named === undefined) {
      return skip(app, 'no tag yet, and the release names no first version')
    }
    // Named on purpose, so the folder need not have changed: what makes the first version
    // may be the host alone.
    if (named !== '1.0.0') {
      return fail(app, `The first version of ${app} is ${app}-v1.0.0.`)
    }
    return { action: 'tag', app, previous, tag: `${app}-v1.0.0` }
  }

  if (!facts.changed) {
    if (named === undefined) return skip(app, `unchanged since ${previous}`)
    return fail(
      app,
      `The body names ${app}-v${named}, and apps/${app}/ has not changed since ${previous}.`,
    )
  }

  if (named === undefined) {
    return fail(
      app,
      `apps/${app}/ changed since ${previous}: name its version under \`## Versions\`, one of ${list}.`,
    )
  }
  if (!allowed.includes(named)) {
    return fail(
      app,
      `${app}-v${named} does not follow ${previous}: the next is one of ${list}.`,
    )
  }
  return { action: 'tag', app, previous, tag: `${app}-v${named}` }
}

function skip(app: string, reason: string): Decision {
  return { action: 'skip', app, reason }
}

function fail(app: string, reason: string): Decision {
  return { action: 'fail', app, reason }
}

/**
 * The notes of a Release: one line per commit, an `@name` in backticks so the Release
 * mentions nobody.
 *
 * @param commits The commits that touched the folder, newest first.
 * @param empty The line when there are none.
 * @returns Markdown.
 */
export function formatNotes(
  commits: { hash: string; subject: string }[],
  empty: string,
): string {
  if (commits.length === 0) return `${empty}\n`
  return commits
    .map(
      ({ hash, subject }) =>
        `- ${subject.replace(/(^|[^\w`])@([\w][\w./-]*)/g, '$1`@$2`')} (${hash})`,
    )
    .join('\n')
    .concat('\n')
}

/**
 * The calendar day of an instant in Prague, where the newsroom is.
 *
 * @param instant The moment of the merge.
 * @returns `YYYY-MM-DD`.
 */
export function pragueDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Prague',
    year: 'numeric',
  }).format(instant)
}

/**
 * The folders in apps/ that have no style in the table.
 *
 * @param folders The folder names.
 * @returns The ones RELEASE_STYLES leaves out.
 */
export function unstyledApps(folders: string[]): string[] {
  return folders.filter((folder) => !Object.hasOwn(RELEASE_STYLES, folder))
}

// --- Git and the environment -------------------------------------------------------------

const ROOT = join(import.meta.dirname, '..')

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function lines(output: string): string[] {
  return output.split('\n').filter((line) => line !== '')
}

function appFolders(): string[] {
  return readdirSync(join(ROOT, 'apps'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

/* `git diff --quiet` exits 1 for a difference; anything else non-zero is git failing. */
function folderChanged(from: string, sha: string, app: string): boolean {
  const result = spawnSync(
    'git',
    ['diff', '--quiet', from, sha, '--', `apps/${app}/`],
    { cwd: ROOT, encoding: 'utf8' },
  )
  if (result.status === 0) return false
  if (result.status === 1) return true
  throw new Error(`git diff ${from} ${sha} failed: ${result.stderr}`)
}

function commitsTouching(from: string, sha: string, app: string) {
  return lines(
    git([
      'log',
      '--no-merges',
      '--format=%h%x09%s',
      `${from}..${sha}`,
      '--',
      `apps/${app}/`,
    ]),
  ).map((line) => {
    const [hash, ...subject] = line.split('\t')
    return { hash, subject: subject.join('\t') }
  })
}

function main(): void {
  const mode = process.env.MODE ?? 'check'
  const folders = appFolders()
  const unstyled = unstyledApps(folders)

  if (unstyled.length > 0) {
    console.error(
      `apps/${unstyled.join(', apps/')} has no release style.`,
      'Add it to RELEASE_STYLES in scripts/release-version.ts.',
    )
    process.exit(1)
  }
  if (mode === 'check-apps') {
    console.log(`Every application has a release style: ${folders.join(', ')}.`)
    return
  }
  if (mode !== 'check' && mode !== 'release') {
    console.error(`Unknown MODE ${mode}: check-apps, check or release.`)
    process.exit(1)
  }

  const base = process.env.BASE_REF ?? ''
  if (base !== 'main') {
    console.log(`A PR into ${base || '(no base)'} tags nothing.`)
    return
  }

  const isRelease =
    process.env.HEAD_REF === 'dev' &&
    (process.env.HEAD_REPO ?? '') === (process.env.REPO ?? '')
  const kind = isRelease ? 'release' : 'hotfix'
  const sha = git(['rev-parse', process.env.SHA || 'HEAD'])
  const mergedAt = process.env.MERGED_AT
  const date = pragueDate(mergedAt ? new Date(mergedAt) : new Date())
  const named = isRelease ? parseNamedVersions(process.env.BODY) : []

  const decisions: Decision[] = named
    .filter((entry) => !folders.includes(entry.app))
    .map((entry) =>
      fail(
        entry.app,
        `The body names a version of ${entry.app}, which is no application.`,
      ),
    )
  const releases: {
    app: string
    latest: boolean
    notes: string
    previous: string
    tag: string
  }[] = []

  for (const app of folders) {
    const style = RELEASE_STYLES[app]
    const atSha = lines(git(['tag', '--points-at', sha, '--list', `${app}-*`]))
    const tags = lines(
      git(['tag', '--merged', sha, '--list', `${app}-*`]),
    ).filter((tag) => !atSha.includes(tag))
    const existing = newestTag(app, style, atSha)
    const previous = newestTag(app, style, tags)
    const from = previous ?? `${sha}^1`

    const decision = decideRelease({
      app,
      changed: folderChanged(from, sha, app),
      date,
      existing,
      kind,
      named: named
        .filter((entry) => entry.app === app)
        .map((entry) => entry.version),
      style,
      tags,
    })
    decisions.push(decision)

    if (decision.action === 'tag') {
      const notes = formatNotes(
        commitsTouching(from, sha, app),
        `No commit in apps/${app}/ since ${previous ?? 'the previous main'}.`,
      )
      releases.push({
        app,
        latest: style.latest,
        notes,
        previous: previous ?? '',
        tag: decision.tag,
      })
    }
  }

  report(kind, decisions)

  if (decisions.some((decision) => decision.action === 'fail')) process.exit(1)

  if (mode === 'release' && process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `releases=${JSON.stringify(releases)}\n`,
    )
  }
}

function report(kind: string, decisions: Decision[]): void {
  const rows = decisions.map((decision) => {
    if (decision.action === 'tag') {
      const after = decision.previous ? `after ${decision.previous}` : 'first'
      return `| ${decision.app} | \`${decision.tag}\` | ${after} |`
    }
    const mark = decision.action === 'fail' ? '**Blocks:** ' : ''
    return `| ${decision.app} | — | ${mark}${decision.reason} |`
  })
  const table = [
    `A ${kind} into \`main\`:`,
    '',
    '| Application | Tag | |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')

  console.log(table)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, table)
  }
}

if (import.meta.main) main()
