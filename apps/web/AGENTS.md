# AGENTS.md — the web

The web of the student magazine: `apps/web` in the `cz.vednemesicnik` workspace. The repository's
own guide — the layout, the host, CI, branching, releases, the workflow skills and the shared
rules — is the root [AGENTS.md](../../AGENTS.md); this file is what holds for the web alone.
Paths below are relative to `apps/web`, and commands run from the repository root, whose
scripts forward to this package (`pnpm app:dev` runs `pnpm --filter web app:dev`).

## Project Overview

This is a student magazine publishing platform built with React Router v8, Prisma ORM, and SQLite. The application serves as a content management system for publishing articles, podcast episodes, and archived magazine issues (PDFs). It features role-based access control for both users and authors with a complex permission system tied to content lifecycle states.

## For the workflow skills

What the repository's workflow skills (`/plan-issue`, `/implement-issue`, `/ship-issue`,
`/next-issue`, `/discover-idea`, `/review-idea`, `/ask-design`, `/ask-copy`) read for the web.

- **Gates** — `pnpm app:typecheck`, `pnpm test` and `pnpm biome:check`, all from the root; add
  `pnpm app:build` when the change touches the build, the server or a config, and
  `pnpm build-storybook` when it touches a story. CI runs them as `web-*`, and the pre-push hook
  runs typecheck and test. On a fresh checkout, `pnpm prisma:generate` and
  `pnpm gas:types:generate` first.
- **Seeing a change** — `pnpm app:dev` (port 3000), in the Browser pane through
  `.claude/launch.json`. Sign in with the seed users from `prisma/data/users.ts`; a
  `*.localhost` host gives a test session a cookie jar of its own. Google sign-in and the
  production site's own sign-ins cannot be driven by an agent: say so and hand that check to
  the user. A probe against production stays small.
- **Written design** — the web has no product, architecture or security trio. Its plan is
  `docs/_about-the-project.md`, `docs/_user-roles-and-permissions.md`,
  `docs/_author-roles-and-permissions.md`, `docs/_content-creation-lifecycle.md`,
  `docs/_authentication-middleware.md` and `docs/_apps-script-web-apps.md`; the decisions are
  in the repository's work log. No dated review documents.
- **Design project** — [docs/\_design-project.md](docs/_design-project.md): the app project
  (canvas) and the shared design system artifacts, the document map, the `questions/` index and
  how to read and write them. Screen cutter: `pnpm -s design:screen "<saved file>" <anchor>`
  from the root; a relative path is read from the folder the command was typed in.
- **Copy context** — [docs/\_copy-context.md](docs/_copy-context.md). UI strings live in the
  route modules and components under `app/`; validation messages in each form's `_schema.ts`.
- **Commit scopes** — the area of the change, as used so far: `articles`, `administration`,
  `podcasts`, `archive`, `settings`, `editorial-board`, `users`, `authors`, `sign-in`,
  `membership`, `components`, `home`, `footer`, `seo`, `sentry`, `gas`, `copy-context`,
  `design`; `deps`, `agents`, `skills`, `work-log` for the repository's own.
- **Rules** — the web's rules (§ Agent Rules below) and the repository's shared rules; the
  guidance skills `general-guidance`, `component-authoring`, `react-router`, `prisma-*` and
  `modern-web-guidance` (§ Agent Skills).
- **Issue weighing** — the repository's three questions alone; the web has no release label.
- **Traps** — Node 26, or the seed and the runtime database fail on better-sqlite3's ABI;
  after an `nvm` switch lefthook can die with `env: node` (reinstall the hooks);
  `prisma migrate dev` and `reset` are consent-guarded for agents, so the user runs them;
  an applied migration is never edited; `pnpm generate:static-images` re-encodes every public
  JPEG; the dev server and Prisma read `apps/web/.env`.

## Development Commands

### Running the Application

```bash
pnpm app:dev                       # Start Vite dev server on port 3000
pnpm app:build                     # Build for production
pnpm app:start                     # Run production build
```

### Code Quality

```bash
pnpm app:typecheck                 # Run TypeScript type checking and generate React Router types
pnpm app:routes:generate           # Generate React Router type definitions
pnpm test                          # Run Vitest tests (non-watch mode)
pnpm biome:check                   # Lint and format check (Biome)
pnpm dedupe --check                # Fail on duplicate versions pnpm dedupe can collapse (CI)
```

When the dedupe check fails, often on a Dependabot PR, run `pnpm dedupe` and commit the
lockfile: two copies of a package such as ProseMirror break at runtime.

The formatter is Biome: format with `pnpm exec biome check --write <files>`. Prettier is
installed only as a transitive dependency; running it rewrites files into a style the
repository doesn't use.

### Database Management

```bash
pnpm prisma:generate               # Generate Prisma client
pnpm prisma:migrate:dev            # Create and apply migration (dev)
pnpm prisma:migrate:dev-init       # Create initial migration (create-only)
pnpm prisma:migrate:deploy         # Apply migrations (production)
pnpm prisma:migrate:reset          # Reset database and re-apply migrations
pnpm prisma:db:push                # Push schema changes without migration
pnpm prisma:db:seed                # Seed database
pnpm prisma:format                 # Format Prisma schema file
pnpm prisma:studio                 # Open Prisma Studio
```

### Testing and Utilities

```bash
pnpm test                          # Run all Vitest tests (the web's, then the host's)
pnpm --filter web test <path>      # Run one web test file (a path relative to apps/web)
pnpm sql:generate                  # Generate SQL scripts
pnpm generate:static-images        # Generate static images using Sharp
```

### Google Apps Script Contracts

The Google Apps Script web apps expose their JSON-Schema response contract via
`doGet`. The committed schema under `schemas/<name>/` is the source of truth;
types are generated into the gitignored `generated/<name>/` (regenerated in
CI/Docker, like the Prisma client).

```bash
pnpm gas:schema:fetch [name]       # Download each web app's doGet JSON Schema (network)
pnpm gas:types:generate            # Generate types from the committed schemas (offline)
```

On a fresh checkout, run `pnpm gas:types:generate` (like `pnpm prisma:generate`)
before `pnpm app:typecheck`, otherwise the `@generated/<name>/response` imports
won't resolve. Endpoints are registered in `constants/gas-endpoints.ts`.

## Architecture

### Path Aliases

- `~/` → `./app/` - Application code
- `~~/` → `./prisma/` - Database schema and migrations
- `@generated/` → `./generated/` - Generated files
- `@constants/` → `./constants/` - Shared constants

### Routing Structure

React Router v8 file-based routing with nested layouts:

- Public routes: Home, Articles, Editorial Board, Organization, Support, Archive, Podcasts
- Administration routes: Nested under `/administration` with authentication required
- Resource routes: Image serving endpoints (`/resources/*`)

Routes are defined in `app/routes.ts` using the React Router config format.

### Database Schema

SQLite database with Prisma ORM. Key entities:

- **User**: System users with authentication (password/passkeys/connections)
- **Author**: Content creators linked 1:1 with Users
- **Article**: Blog posts with featured images, tags, and categories
- **Podcast/PodcastEpisode**: Podcast management with episodes and links
- **Issue**: Magazine issues with PDF and cover images

All content entities (Article, Podcast, PodcastEpisode, Issue, etc.) support three states: `draft`, `published`, `archived`.

### Permission System

#### User Roles (system access)

- **Member** (level 3): Can view/update own account (through Settings) and author profile
- **Administrator** (level 2): Full access to users and authors except Owner accounts
- **Owner** (level 1): Full system control; exactly one Owner (from seed), and the Owner role cannot be assigned (single-owner policy)

#### Author Roles (content management)

- **Contributor** (level 3): Can create/edit/view/delete own draft content
- **Creator** (level 2): Submits own content for review like a Contributor (only the Coordinator approves and publishes), sees others' drafts, and retracts and archives own published content
- **Coordinator** (level 1): Full access to all content in all states

Permissions are checked via:

- `app/utils/permissions/user/context/get-user-permission-context.server.ts` - System permissions (User/Author entities)
- `app/utils/permissions/author/context/get-author-permission-context.server.ts` - Content permissions (articles, podcasts, issues, etc.)

Permissions use `action` (view, create, update, delete, publish, retract, archive, restore), `entity` (user, author, article, etc.), `access` (own, any), and `state` (draft, published, archived) fields.

### Content Lifecycle

```
Draft → Published → Archived
          ↓
        Draft (via retract)
```

Archived content can be restored to draft (Coordinator only).

### Component Organization

- `app/components/` - Reusable UI components (each with its own directory containing component file and CSS module)
- `app/routes/` - Route-specific components organized by route path
- `app/utils/` - Server and client utilities
- `app/styles/` - Global CSS: primitive tokens (`primitive-tokens.css`), semantic tokens — one role map, light/dark via `light-dark()` (`semantic-tokens.css`), fonts, sizes, global styles

Each component lives in its own kebab-case directory: `_component.tsx`, `_styles.module.css` and `index.ts`, with stories in `_component.stories.tsx` (see `.agents/skills/general-guidance/references/storybook.md`).

### Image Handling

Images live in an object store under the `images/` prefix — a volume or Tigris, picked by
`STORE_DRIVER` — as pre-generated variants, and are served via resource routes:

- `/resources/article-image/…`
- `/resources/issue-cover/:issueId`
- `/resources/podcast-cover/:podcastId`
- `/resources/podcast-episode-cover/:episodeId`
- `/resources/user-image/:userId`

Utilities:

- `app/utils/image-store/` - the image store, variant generation, serving and responsive sources (`create-image-sources.ts`)
- `app/utils/sharp.server.ts` - Sharp image transformations

### Authentication

Session-based authentication with multiple methods:

- Magic link by e-mail, Google (OAuth) and passkeys (WebAuthn via @simplewebauthn) — the main paths
- Password (bcrypt hashed) — an emergency path, off unless `ALLOW_PASSWORD_SIGN_IN` is set;
  only Owner and Administrator may set it and its two-factor authentication
  (`can-use-emergency-password.ts`)
- Emergency sign-in link — under the same switch, an Owner or Administrator issues a one-time
  15-minute link for an account they may edit (`can-issue-emergency-sign-in-link.ts`,
  `app/utils/emergency-sign-in-link/`); handed over by phone or chat, never by e-mail

Session management in `app/utils/auth.server.ts` using cookie-based sessions.

CSRF protection via `app/utils/csrf.server.ts` and honeypot via `app/utils/honeypot.server.ts`.
Administration actions check the session before the token (design 30h): `checkCSRF` for a
form that stays on screen (returns the form message as data; the layout revalidates and
reissues the token), `requireCSRF` for one-click actions (throws the 403 token marker).

### Form Handling

Forms use Conform (@conform-to/react + @conform-to/zod) with Zod validation:

- Server-side validation in route actions
- Form state management via useForm hook
- Multipart form data handling via `@mjackson/form-data-parser`

### Configuration Files

The host that serves the build (`server.ts`, `server/`) and the repository's Biome and lefthook
configs are at the root (root [AGENTS.md](../../AGENTS.md)). The web's own:

- `vite.config.ts` - Dev server on port 3000, React Router plugin, tsconfig paths
- `react-router.config.ts` - SSR enabled
- `tsconfig.json` - Path aliases configured (`~/*`, `~~/*`, `@generated/*`, `@constants/*`)
- `prisma/schema.prisma` - Database schema with SQLite provider

## Important Patterns

### Permission Checks

Always check permissions before rendering UI or processing actions. Build a
permission context from the request, then call `can()` for a single
action + entity; it returns `{ hasOwn, hasAny, hasPermission }`.

```typescript
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

// System axis: can the current user update this account?
const userContext = await getUserPermissionContext(request, {
  actions: ["update"],
  entities: ["user"],
})
const canUpdateUser = userContext.can({
  action: "update",
  entity: "user",
  targetUserId: user.id,
  targetUserRoleLevel: user.role.level,
}).hasPermission

// Content axis: can the current author publish this draft article?
const authorContext = await getAuthorPermissionContext(request, {
  actions: ["publish"],
  entities: ["article"],
})
const canPublish = authorContext.can({
  action: "publish",
  entity: "article",
  state: "draft",
  targetAuthorIds: article.authors.map((author) => author.id),
}).hasPermission
```

### Content State Management

Content state transitions must respect the lifecycle and role permissions. Use the configuration from `app/config/content-state-config.ts`.

### Slugs

URL-friendly slugs are generated using `app/utils/slugify.ts` for articles, podcasts, tags, and categories.

### Error Handling

- `app/utils/throw-error.server.ts` - General error throwing
- `app/utils/throw-db-error.server.ts` - Database-specific errors

### Testing

Tests use Vitest and are co-located with utilities (e.g., `slugify.test.ts`, `get-user-rights.test.ts`).
They run in Node; a hook or component test opts into jsdom with the docblock
`// @vitest-environment jsdom` and renders with React Testing Library (`renderHook`, `render`),
calling `cleanup` in `afterEach`.

## Documentation

The web's documents are in `docs/` here; the deployment, backups, branching and the work log
are in the repository's [docs/](../../docs/README.md).

- `docs/_about-the-project.md` - Project overview and architecture
- `docs/_user-roles-and-permissions.md` - User role details
- `docs/_author-roles-and-permissions.md` - Author role details
- `docs/_content-creation-lifecycle.md` - Content states and transitions
- `docs/_authentication-middleware.md` - Authentication architecture and future middleware migration plan
- `docs/_prisma-studio-on-production.md` - Running Prisma Studio against the production database over a Fly tunnel
- `docs/_apps-script-web-apps.md` - Which Google Apps Script does what for the web, with a diagram
- `docs/_design-project.md` - The design project and design system, two artifacts (links, documents, `questions/`), reading and writing them, and reading a screen with `pnpm design:screen`
- `docs/_copy-context.md` - Context the copywriter gets in every `/ask-copy` thread: terms, content states, roles, voice (Czech)

## Environment

The web's environment variables go in `apps/web/.env` (see `.env.example`); its dev server and
Prisma run with `apps/web` as the working directory.

## Agent Skills

The web's own skills live in `.agents/skills/` here and are linked into `.claude/skills/` by
the root's `pnpm claude:skills:link`. Claude Code loads them once it reads or edits a file in
`apps/web`. Load only the ones that apply.

- **General Guidance** — `.agents/skills/general-guidance/SKILL.md`. Load when writing or
  updating story files (`.stories.tsx`) or any `.module.css` / `.css` file.
- **Component Authoring** — `.agents/skills/component-authoring/SKILL.md`. Load before writing
  markup or a component, planning a new component, or changing a component's props: compound
  components first, then props, render props to hand values out; semantic HTML; no layout
  shift; reusing existing components.
- **React Router** — `.agents/skills/react-router/SKILL.md`. Load when configuring routes,
  route modules, loaders, actions, forms, fetchers, navigation, pending UI, SSR, or middleware.
- **Prisma** — this project uses **SQLite**, so the CLI and Client API skills are the primary
  ones; the Postgres/Compute skills rarely apply.
  - `.agents/skills/prisma-cli/SKILL.md` — CLI commands (`init`, `generate`, `migrate`, `db`, `studio`, `validate`, `format`).
  - `.agents/skills/prisma-client-api/SKILL.md` — Client API for queries, filters, CRUD, and `$transaction`.
  - `.agents/skills/prisma-database-setup/SKILL.md` — configuring database providers and troubleshooting connections.
  - `.agents/skills/prisma-driver-adapter-implementation/SKILL.md` — required reference when implementing or modifying Prisma v7 driver adapters.
  - `.agents/skills/prisma-upgrade-v7/SKILL.md` — migration guide from Prisma ORM v6 to v7.
  - `.agents/skills/prisma-postgres/SKILL.md`, `.agents/skills/prisma-postgres-setup/SKILL.md`, `.agents/skills/prisma-compute/SKILL.md` — not used by this project (SQLite).

`modern-web-guidance` is the repository's, at the root, and applies to the web's HTML, CSS and
client-side JS.

## Agent Rules

Mandatory conventions for the web's code. Read the relevant rule file before acting. These bind
`apps/web` only; the repository's shared rules are listed in the root
[AGENTS.md](../../AGENTS.md) § Agent Rules and bind the web as well.

- **Comments** — writing or editing any comment, TSDoc block or CSS comment, or reviewing a
  diff that adds them: `.agents/rules/comments/RULE.md`.
- **File Naming** — when creating or renaming any file: `.agents/rules/file-naming/RULE.md`.
- **TypeScript Conventions** — when writing any TypeScript type definitions:
  `.agents/rules/typescript-conventions/RULE.md`.
- **Functional Style** — when writing any stateful object (store, registry, cache, manager) or
  considering a class: `.agents/rules/functional-style/RULE.md`.
- **CSS Before JS** — when writing client code that changes how something looks or moves with
  state, or reviewing such a diff: `.agents/rules/css-before-js/RULE.md`.
- **One Function per File** — when writing a new utility, helper or server function, or adding
  a function to an existing module: `.agents/rules/one-function-per-file/RULE.md`.
- **Naming (no abbreviations)** — when naming any variable, function parameter, function, or
  callback argument: `.agents/rules/naming-no-abbreviations/RULE.md`.
