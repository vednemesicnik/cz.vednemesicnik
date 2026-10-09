# AGENTS.md

Agent guidance for working with code in this repository.

## Project Overview

This is a student magazine publishing platform built with React Router v8, Prisma ORM, and SQLite. The application serves as a content management system for publishing articles, podcast episodes, and archived magazine issues (PDFs). It features role-based access control for both users and authors with a complex permission system tied to content lifecycle states.

## Code Editing Workflow

Change existing files with the Edit tool, so every change reaches the user as a reviewable diff in the IDE; use Write only for new files.

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
```

The formatter is Biome: format with `pnpm exec biome check --write <files>`. Prettier is
installed only as a transitive dependency; running it rewrites files into a style the
repository doesn't use.

### Git Hooks

Install Git hooks for code quality automation:

```bash
pnpm lefthook:install              # Install Lefthook Git hooks
```

### Claude Code Skills

Claude Code discovers project skills only in `.claude/skills/`, which is gitignored. The
skills live in `.agents/skills/` and are linked in one symlink per skill:

```bash
pnpm claude:skills:link            # Link .agents/skills/* into .claude/skills
```

Run it after cloning and after a pull that adds a skill; in a Claude Code cloud
environment, have the setup script run it. It is idempotent, removes links to deleted
skills, and never replaces a real file or directory in `.claude/skills`, so personal
skills can sit next to the linked ones. Git worktrees under `.claude/worktrees/` pick up
the main checkout's links.

### Branching & Pull Requests

`dev` is the default branch; `main` is production and the only deploy source. Branch
off `dev` in kebab-case with the issue number (e.g. `feat/155-branching-model-dev`) and
target `dev` in the PR. A small follow-up goes straight to a PR without an issue, on a
branch without a number (e.g. `ci/pr-title-check`). Releases (`dev → main`) and hotfixes
target `main`. See `docs/_branching-model.md` for the full flow and merge-method conventions.

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
pnpm test                          # Run all Vitest tests
pnpm sql:generate                  # Generate SQL scripts
pnpm generate:static-images        # Generate static images using Sharp
pnpm docker:compose:up             # Start Docker containers
pnpm docker:compose:down           # Stop Docker containers
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

- **Member** (level 3): Can view/update own account and author profile
- **Administrator** (level 2): Full access to users and authors except Owner accounts
- **Owner** (level 1): Full system control; exactly one Owner (from seed), and the Owner role cannot be assigned (single-owner policy)

#### Author Roles (content management)

- **Contributor** (level 3): Can create/edit/view/delete own draft content
- **Creator** (level 2): Can publish own content once a Coordinator has approved it, and retract and archive own published content
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
- Password (bcrypt hashed) — an emergency path, off unless `ALLOW_PASSWORD_SIGN_IN` is set

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

## Documentation

Comprehensive project documentation is in the `docs/` directory:

- `docs/_about-the-project.md` - Project overview and architecture
- `docs/_user-roles-and-permissions.md` - User role details
- `docs/_author-roles-and-permissions.md` - Author role details
- `docs/_content-creation-lifecycle.md` - Content states and transitions
- `docs/_authentication-middleware.md` - Authentication architecture and future middleware migration plan
- `docs/_branching-model.md` - Branching model, merge methods, hotfix procedure
- `docs/_deploy-to-fly.md` - Deployment instructions
- `docs/_manual-database-backup.md` - Database backup procedures
- `docs/_manual-database-restore.md` - Database restore procedures
- `docs/_prisma-studio-on-production.md` - Running Prisma Studio against the production database over a Fly tunnel
- `docs/_design-project.md` - The Claude Design project and design system (ids, documents, `questions/`), and reading a screen with `pnpm design:screen`
- `docs/_copy-context.md` - Context the copywriter gets in every `/ask-copy` thread: terms, content states, roles, voice (Czech)

## Environment

Node.js >= 26.0.0 required (see `engines.node` in `package.json`; `.nvmrc` pins the major to `26`). Environment variables should be in `.env` (see `.env.example`).

## Agent Skills

Load only the skills that apply to your current task. They live in `.agents/skills/`;
`pnpm claude:skills:link` links them into `.claude/skills/` so Claude Code can invoke them as slash
commands (see [Claude Code Skills](#claude-code-skills)).

### General Guidance

Project-specific conventions and guidelines for recurring tasks. Load when writing or updating story files (`.stories.tsx`), when writing or editing any `.module.css` or `.css` file, or when cutting a release (`dev → main` PR).

Read `.agents/skills/general-guidance/SKILL.md` — it lists the covered domains and directs you to the correct reference file.

### Modern Web Guidance

A search tool for modern web development best practices. **Execute first** for all HTML/CSS and client-side JS tasks — web APIs evolve rapidly and training weights contain obsolete patterns.

**Trigger for:** UI/layout (modals, dialogs, popovers, anchor positioning, container queries, `:has()`), scroll/motion (View Transitions, scroll-driven animations), performance (CWV, image optimization), forms/autofill, passkeys, and general frontend patterns.

**Do not trigger for:** backend (SQL, ORMs, API routes), CI/CD pipelines, or generic scripts.

**Usage — two steps:**

```sh
# Step 1: search for relevant use cases
npx -y modern-web-guidance@latest search "<query>" --skill-version 2026_09_04-7de96777

# Step 2: retrieve the full guide by id from step 1
npx -y modern-web-guidance@latest retrieve "<id>"
```

If search returns no matches or low similarity scores, list all available guides:

```sh
npx -y modern-web-guidance@latest list
```

### React Router

Reference for working with React Router. Load when configuring routes, route modules, loaders, actions, forms, fetchers, navigation, pending UI, SSR, or middleware.

Read `.agents/skills/react-router/SKILL.md` — it identifies the project mode and directs you to the correct reference file.

### Prisma

Reference skills for working with Prisma ORM. This project uses **SQLite**, so the CLI and Client API skills are the primary ones; the Postgres/Compute skills rarely apply. Load the relevant `SKILL.md` before acting.

- `.agents/skills/prisma-cli/SKILL.md` — CLI commands (`init`, `generate`, `migrate`, `db`, `studio`, `validate`, `format`).
- `.agents/skills/prisma-client-api/SKILL.md` — Client API for queries, filters, CRUD, and `$transaction`.
- `.agents/skills/prisma-database-setup/SKILL.md` — configuring database providers and troubleshooting connections.
- `.agents/skills/prisma-driver-adapter-implementation/SKILL.md` — required reference when implementing or modifying Prisma v7 driver adapters.
- `.agents/skills/prisma-upgrade-v7/SKILL.md` — migration guide from Prisma ORM v6 to v7.
- `.agents/skills/prisma-postgres/SKILL.md`, `.agents/skills/prisma-postgres-setup/SKILL.md`, `.agents/skills/prisma-compute/SKILL.md` — Prisma Postgres and Compute deployment; not used by this project (SQLite).

### Pull Request Workflow

Reference for the end-to-end PR lifecycle. Load when opening a pull request, requesting or acting on a Copilot review, resolving review threads, or choosing a merge method.

Read `.agents/skills/pull-request-workflow/SKILL.md`. Run the `self-review-before-pr` rule first; see `docs/_branching-model.md` for the full branching/merge policy.

### Issue Pipeline

From an idea to a merged PR, one issue per context window:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → `/ship-issue` → `/next-issue`.

- `.agents/skills/discover-idea/SKILL.md` — sweep one area for evidenced gaps (design vs. app, unbuilt design answers, disagreements); weighs nothing.
- `.agents/skills/review-idea/SKILL.md` — weigh a proposal before it becomes an issue; a well-argued no is a result.
- `.agents/skills/plan-issue/SKILL.md` — plan-mode implementation plan, saved to `~/.claude/plans/plan-issue-<n>-<slug>.md`.
- `.agents/skills/implement-issue/SKILL.md` — execute the approved plan on a feature branch; stops before the PR.
- `.agents/skills/review-implementation/SKILL.md` — the pre-PR review on its own (report-only).
- `.agents/skills/ship-issue/SKILL.md` — review, PR, Copilot loop, green CI, then ask and merge.
- `.agents/skills/next-issue/SKILL.md` — after the merge: aftermath, handoff, pick the next issue.

### Design and Copy

Loops for decisions this repository does not own. Load when a screen, component or token needs a decision from the Claude Design project, when a design document comes back with open questions, or when user-facing Czech needs a copywriter.

- `.agents/skills/ask-design/SKILL.md` — put a question to the Claude Design project, read the answer back (`check`), retire settled questions (`tidy`). See `docs/_design-project.md`.
- `.agents/skills/ask-copy/SKILL.md` — take strings through the copywriter in the shared room (`vdm-dev-exchange` in `.mcp.json`). Every thread opens with the whole of `docs/_copy-context.md`.

## Agent Rules

Mandatory conventions that apply to all tasks. Read the relevant rule file before acting.

### Package Versions

Applies when installing or updating packages, or editing `package.json` dependencies directly.

Read `.agents/rules/package-versions/RULE.md` before acting.

### File Naming

Applies when creating or renaming any file.

Read `.agents/rules/file-naming/RULE.md` before acting.

### TypeScript Conventions

Applies when writing any TypeScript type definitions.

Read `.agents/rules/typescript-conventions/RULE.md` before acting.

### Functional Style

Applies when writing any stateful object (store, registry, cache, manager) or considering a class.

Read `.agents/rules/functional-style/RULE.md` before acting.

### One Function per File

Applies when writing a new utility, helper or server function, or adding a function to an existing module.

Read `.agents/rules/one-function-per-file/RULE.md` before acting.

### Generic Guidance Examples

Applies when writing or editing a rule, a skill, or the conventions in this file.

Read `.agents/rules/generic-guidance-examples/RULE.md` before acting.

### Naming (no abbreviations)

Applies when naming any variable, function parameter, function, or callback argument.

Read `.agents/rules/naming-no-abbreviations/RULE.md` before acting.

### Self-Review Before PR

Applies when opening a pull request or requesting an automated/Copilot review.

Read `.agents/rules/self-review-before-pr/RULE.md` before acting.