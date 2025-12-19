# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a student magazine publishing platform built with React Router v7, Prisma ORM, and SQLite. The application serves as a content management system for publishing articles, podcast episodes, and archived magazine issues (PDFs). It features role-based access control for both users and authors with a complex permission system tied to content lifecycle states.

## Development Commands

### Running the Application

```bash
pnpm dev                           # Start Vite dev server on port 3000
pnpm build                         # Build for production
pnpm start                         # Run production build
```

### Code Quality

```bash
pnpm typecheck                     # Run TypeScript type checking and generate React Router types
pnpm routes:generate               # Generate React Router type definitions
pnpm lint                          # Run ESLint
pnpm test                          # Run Vitest tests (non-watch mode)
```

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

## Architecture

### Path Aliases

- `~/` → `./app/` - Application code
- `~~/` → `./prisma/` - Database schema and migrations
- `@generated/` → `./generated/` - Generated files
- `@constants/` → `./constants/` - Shared constants

### Routing Structure

React Router v7 file-based routing with nested layouts:

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
- **EditorialBoard**: Positions and members

All content entities (Article, Podcast, PodcastEpisode, Issue, etc.) support three states: `draft`, `published`, `archived`.

### Permission System

#### User Roles (system access)

- **Member** (level 3): Can view/update own account and author profile
- **Administrator** (level 2): Full access to users and authors except Owner accounts
- **Owner** (level 1): Full system control including Owner role assignment

#### Author Roles (content management)

- **Contributor** (level 3): Can create/edit/view/delete own draft content
- **Creator** (level 2): Can publish, retract, and archive own content
- **Coordinator** (level 1): Full access to all content in all states

Permissions are checked via:

- `app/utils/get-user-rights.ts` - System permissions (User/Author entities)
- `app/utils/get-author-rights.ts` - Content permissions (articles, podcasts, issues, etc.)

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
- `app/styles/` - Global CSS (colors, fonts, sizes, global styles)

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

Always check permissions before rendering UI or processing actions:

```typescript
import { getUserRights } from "~/utils/get-user-rights"
import { getAuthorRights } from "~/utils/get-author-rights"

// Check if user can update their profile
const canUpdate = getUserRights(userRole).user.update.own

// Check if author can publish their draft article
const canPublish = getAuthorRights(authorRole).article.publish.own.draft
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
- `docs/_deploy-to-fly.md` - Deployment instructions
- `docs/_manual-database-backup.md` - Database backup procedures
- `docs/_manual-database-restore.md` - Database restore procedures

## Environment

Node.js >= 22 required. Environment variables should be in `.env` (see `.env.example`).
