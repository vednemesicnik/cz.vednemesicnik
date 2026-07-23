# AGENTS.md

Agent guidance for working with code in this repository.

## Project Overview

This is a student magazine publishing platform built with React Router v8, Prisma ORM, and SQLite. The application serves as a content management system for publishing articles, podcast episodes, and archived magazine issues (PDFs). It features role-based access control for both users and authors with a complex permission system tied to content lifecycle states.

## Code Editing Workflow

**IMPORTANT**: When making changes to files, always use the **Edit tool**. This enables user review and approval of changes through the IDE's diff interface before applying modifications. Never use tools that directly overwrite files without user confirmation.

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
```

### Git Hooks

Install Git hooks for code quality automation:

```bash
pnpm lefthook:install              # Install Lefthook Git hooks
```

### Branching & Pull Requests

`dev` is the default branch; `main` is production and the only deploy source. Branch
off `dev` in kebab-case with the issue number (e.g. `feat/155-branching-model-dev`) and
target `dev` in the PR. Releases (`dev → main`) and hotfixes target `main`. See
`docs/_branching-model.md` for the full flow and merge-method conventions.

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
- **Creator** (level 2): Can publish, retract, and archive own content
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
- `app/styles/` - Global CSS: primitive tokens (`primitive-tokens.css`), semantic tokens with public/admin themes (`semantic-tokens.css`), fonts, sizes, global styles

Components use CSS modules with the pattern `ComponentName/ComponentName.tsx` and `ComponentName/ComponentName.css`.

### Image Handling

Images are stored as `Bytes` in SQLite and served via resource routes:

- `/resources/issue-cover/:issueId`
- `/resources/podcast-cover/:podcastId`
- `/resources/podcast-episode-cover/:episodeId`
- `/resources/user-image/:userId`

Utilities:

- `app/utils/image.server.ts` - Image processing
- `app/utils/sharp.server.ts` - Sharp image transformations
- `app/utils/create-image-sources.ts` - Responsive image source generation

### Authentication

Session-based authentication with multiple methods:

- Password (bcrypt hashed)
- Passkeys (WebAuthn via @simplewebauthn)
- OAuth connections

Session management in `app/utils/auth.server.ts` using cookie-based sessions.

CSRF protection via `app/utils/csrf.server.ts` and honeypot via `app/utils/honeypot.server.ts`.

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

## Environment

Node.js >= 26.0.0 required (see `engines.node` in `package.json`; `.nvmrc` pins the major to `26`). Environment variables should be in `.env` (see `.env.example`).

## Agent Skills

Skills are split into two categories. Load only the skills that apply to your current task.

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
npx -y modern-web-guidance@latest search "<query>" --skill-version 2026_05_16-c5e7870

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

### Naming (no abbreviations)

Applies when naming any variable, function parameter, function, or callback argument.

Read `.agents/rules/naming-no-abbreviations/RULE.md` before acting.

### Self-Review Before PR

Applies when opening a pull request or requesting an automated/Copilot review.

Read `.agents/rules/self-review-before-pr/RULE.md` before acting.