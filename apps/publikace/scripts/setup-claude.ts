import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { dirname, join } from 'node:path'

/*
 * What a checkout needs before Claude Code can read this repository: the skills that are
 * somebody else's fetched, a symlink per skill, and a `CLAUDE.md` that imports the guide
 * every other agent is pointed at. All three sit outside git — `.claude/` is ignored in full
 * and `CLAUDE.md` with it, because a guide named after one vendor is not what a repository
 * heading for the public carries — so this is run once per clone by whoever works with
 * Claude. It stays out of `postinstall` because an install step is for what everybody here
 * needs.
 *
 * Nothing here overwrites. A skill directory of your own, or a `CLAUDE.md` you have written
 * yourself, is left where it stands and named in the output.
 */

const ROOT = join(import.meta.dirname, '..')
const SOURCE = join(ROOT, '.agents', 'skills')
const TARGET = join(ROOT, '.claude', 'skills')

/* Relative, so the link reads the same on every machine and survives the repository being
   cloned somewhere else — an absolute one would carry one developer's home directory. */
const LINK_PREFIX = join('..', '..', '.agents', 'skills')

/* The skills `remix new` writes into a new app, copied from the CLI's template on every run. */
const SCAFFOLD_SKILLS = ['remix']

const GUIDE = join(ROOT, 'CLAUDE.md')

/* `@AGENTS.md` is an import rather than a copy, so the guide stays one file and this one
   never falls behind it. */
const GUIDE_CONTENT = '# CLAUDE.md\n\n@AGENTS.md\n'

async function main(): Promise<void> {
  await copyScaffoldSkills()
  await fetchVendoredSkills()
  await linkSkills()
  await writeGuide()
}

/*
 * The Remix skill is the scaffolder's. `remix new` writes `.agents/skills/remix/` into every new
 * app, and `@remix-run/cli` carries the same files in its `template/`, so a checkout can have it
 * by copying rather than by tracking a second copy of somebody else's documentation.
 *
 * **The published package is the only source there is.** The skill is not in `remix-run/remix`:
 * `packages/cli` holds no `template/`, which is assembled at publish time, and the `.agents/`
 * at that repository's root is Remix's own contributor tooling — `fix-issue`, `make-pr` — and a
 * different `remix` skill of 5 kB with no `references/`. So there is no newer revision upstream
 * to fall behind, and what a checkout gets is what `remix new` would write today, pinned by the
 * lockfile that pins the CLI.
 *
 * Copied from `node_modules` rather than by running `remix new`, which wants to scaffold a whole
 * project into an empty directory and would have nowhere to put one here. Resolved **through
 * `remix`**, because `@remix-run/cli` is its dependency rather than ours and pnpm does not
 * hoist: there is no `node_modules/@remix-run` at the root to look in.
 *
 * It is replaced rather than merged, every run. That is the point: it was a fork until
 * 18 Sep 2026 and the fork had gone stale — it still described an `app/actions/render.tsx` this
 * app no longer has, while the scaffold had moved to the `render()` middleware the app actually
 * installs. Anything of ours belongs in AGENTS.md, which nothing here overwrites.
 */
async function copyScaffoldSkills(): Promise<void> {
  let template: string
  try {
    let fromRoot = createRequire(join(ROOT, 'package.json'))
    let fromRemix = createRequire(fromRoot.resolve('remix/package.json'))
    template = join(dirname(fromRemix.resolve('@remix-run/cli/package.json')), 'template')
  } catch {
    console.log('  @remix-run/cli is not installed — run pnpm install')
    return
  }

  for (let name of SCAFFOLD_SKILLS) {
    let from = join(template, '.agents', 'skills', name)
    if ((await describe(join(from, 'SKILL.md'))) === 'missing') {
      console.log(`  ${name} is not in @remix-run/cli's template — run pnpm install`)
      continue
    }

    await rm(join(SOURCE, name), { force: true, recursive: true })
    await cp(from, join(SOURCE, name), { recursive: true })
  }
}

/*
 * The skills that are somebody else's are fetched rather than tracked, so a fresh clone has
 * `skills-lock.json` and no guides. This is what turns the one into the other, and it runs
 * before the links because a skill with no directory gets no link.
 *
 * The CLI is Vercel's `skills`, which is what owns that lockfile — not the `npx
 * modern-web-guidance update` the upstream README suggests, which does not know about it.
 * `update` restores a missing skill as readily as it refreshes a stale one, so there is one
 * command rather than a test and two.
 *
 * A failure here is not fatal. It means the network was unavailable or npm was having a day,
 * and everything else this script does still wants doing — the guides are a mirror of what
 * the skill asks the network for anyway, so a checkout without them is degraded rather than
 * broken.
 */
async function fetchVendoredSkills(): Promise<void> {
  let lock = await read(join(ROOT, 'skills-lock.json'))
  if (lock === undefined) return

  let names = Object.keys(JSON.parse(lock).skills ?? {})
  if (names.length === 0) return

  let missing: string[] = []
  for (let name of names) {
    if ((await describe(join(SOURCE, name, 'SKILL.md'))) === 'missing') missing.push(name)
  }

  if (missing.length === 0) return

  console.log(`fetching ${missing.join(', ')} — tracked as a lockfile, not as files`)

  let result = spawnSync(
    'npx',
    ['-y', 'skills@latest', 'update', ...missing, '--project', '--yes'],
    {
      cwd: ROOT,
      stdio: 'inherit',
    },
  )

  if (result.status !== 0) {
    console.log(`  could not fetch ${missing.join(', ')} — run it again when the network is back`)
  }
}

async function linkSkills(): Promise<void> {
  let names = await findSkills()
  if (names.length === 0) {
    console.error(`No skill in ${SOURCE} — a skill is a directory holding a SKILL.md.`)
    process.exitCode = 1
    return
  }

  await mkdir(TARGET, { recursive: true })

  let linked: string[] = []
  let shadowed: string[] = []

  for (let name of names) {
    let path = join(TARGET, name)
    let entry = await describe(path)

    /* Somebody's own skill of that name. It wins — an uncommitted experiment is the reason
       these are separate links and not one link over the whole directory — but it hides the
       repository's, so it is named rather than passed over. */
    if (entry === 'own') {
      shadowed.push(name)
      continue
    }

    if (entry === 'link' && (await readlink(path)) === join(LINK_PREFIX, name)) continue

    if (entry === 'link') await rm(path)
    await symlink(join(LINK_PREFIX, name), path)
    linked.push(name)
  }

  let pruned = await pruneStaleLinks(names)

  console.log(`${names.length} skills in .agents/skills/, linked into .claude/skills/`)
  if (linked.length > 0) console.log(`  linked: ${linked.join(', ')}`)
  if (pruned.length > 0) console.log(`  pruned: ${pruned.join(', ')}`)
  if (shadowed.length > 0) {
    console.log(`  shadowed by a local directory of the same name: ${shadowed.join(', ')}`)
  }
}

async function writeGuide(): Promise<void> {
  let existing = await read(GUIDE)

  if (existing === GUIDE_CONTENT) return
  if (existing !== undefined) {
    console.log('CLAUDE.md is yours — left as it is. Delete it to have this one written again.')
    return
  }

  await writeFile(GUIDE, GUIDE_CONTENT)
  console.log('CLAUDE.md written, importing AGENTS.md')
}

async function findSkills(): Promise<string[]> {
  let entries = await readdir(SOURCE, { withFileTypes: true })
  let names: string[] = []

  for (let entry of entries) {
    if (!entry.isDirectory()) continue
    if ((await describe(join(SOURCE, entry.name, 'SKILL.md'))) === 'missing') continue
    names.push(entry.name)
  }

  return names.sort()
}

/*
 * Removes links this script left behind for a skill that has since been renamed or dropped.
 * A link pointing anywhere else is somebody else's, and a real directory is the case above.
 */
async function pruneStaleLinks(names: string[]): Promise<string[]> {
  let entries = await readdir(TARGET, { withFileTypes: true })
  let pruned: string[] = []

  for (let entry of entries) {
    if (!entry.isSymbolicLink() || names.includes(entry.name)) continue

    let path = join(TARGET, entry.name)
    if (!(await readlink(path)).startsWith(LINK_PREFIX)) continue

    await rm(path)
    pruned.push(entry.name)
  }

  return pruned
}

/* `lstat` rather than `stat` so a link is reported as itself instead of as what it points
   at — a link to a skill that no longer exists has to be distinguishable from no link. */
async function describe(path: string): Promise<'missing' | 'link' | 'own'> {
  try {
    let stats = await lstat(path)
    return stats.isSymbolicLink() ? 'link' : 'own'
  } catch {
    return 'missing'
  }
}

async function read(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return undefined
  }
}

await main()
