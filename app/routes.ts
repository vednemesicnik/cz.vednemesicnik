// noinspection JSUnusedGlobalSymbols

import {
  index,
  layout,
  prefix,
  type RouteConfig,
  route,
} from '@react-router/dev/routes'
import { createAdminEntriesIntersection } from '../utils/create-admin-entries-intersection'
import { createAdminEntriesSection } from '../utils/create-admin-entries-section'
import { createAdminIntersection } from '../utils/create-admin-intersection'
import { createAdminRecordSection } from '../utils/create-admin-record-section'

export default [
  // Health check route
  route('health', 'routes/health/route.ts'),

  // Sitemap of public pages for crawlers (linked from public/robots.txt)
  route('sitemap.xml', 'routes/sitemap/route.ts'),

  // Website
  layout('routes/__layout/route.tsx', [
    // Home route
    index('routes/_index/route.tsx'),

    // Articles routes
    ...prefix('articles', [
      layout('routes/articles/__layout/route.tsx', [
        index('routes/articles/_index/route.tsx'),
        ...prefix('categories', [
          layout('routes/articles/categories/__layout/route.tsx', [
            index('routes/articles/categories/_index/route.tsx'),
            route(':slug', 'routes/articles/categories/category/route.tsx'),
          ]),
        ]),
        ...prefix('tags', [
          layout('routes/articles/tags/__layout/route.tsx', [
            index('routes/articles/tags/_index/route.tsx'),
            route(':slug', 'routes/articles/tags/tag/route.tsx'),
          ]),
        ]),
        route(':articleSlug', 'routes/articles/article/route.tsx'),
      ]),
    ]),

    // Podcasts routes
    ...prefix('podcasts', [
      layout('routes/podcasts/__layout/route.tsx', [
        index('routes/podcasts/_index/route.tsx'),
        ...prefix(':podcastSlug', [
          layout('routes/podcasts/podcast/__layout/route.tsx', [
            index('routes/podcasts/podcast/_index/route.tsx'),
            route(':episodeSlug', 'routes/podcasts/podcast/episode/route.tsx'),
          ]),
        ]),
      ]),
    ]),

    // Archive routes
    ...prefix('archive', [
      index('routes/archive/_index/route.tsx'),
      route(':fileName', 'routes/archive/issue-pdf/route.tsx'),
    ]),

    // Editorial Board routes
    route('editorial-board', 'routes/editorial-board/route.tsx'),

    // Organization routes
    route('organization', 'routes/organization/route.tsx'),

    // Support routes
    route('support', 'routes/support/route.tsx'),

    // Grants routes
    ...prefix('grants', [
      layout('routes/grants/__layout/route.tsx', [
        index('routes/grants/_index/route.tsx'),
        route(':grantSlug', 'routes/grants/grant/route.tsx'),
      ]),
    ]),

    // Unknown website addresses
    route('*', 'routes/404/route.tsx'),
  ]),

  // Administration
  ...prefix('administration', [
    layout('routes/administration/__layout/route.tsx', [
      // Sign out
      route('sign-out', 'routes/administration/sign-out/route.ts'),

      // Non-authenticated routes
      layout('routes/administration/__layout-non-authenticated/route.tsx', [
        // Sign in — method chooser
        route('sign-in', 'routes/administration/sign-in/route.tsx'),

        // Break-glass password sign-in form
        route(
          'sign-in/password',
          'routes/administration/sign-in/password/route.tsx',
        ),

        // Break-glass password second factor (TOTP) entry step
        route(
          'sign-in/verify-2fa',
          'routes/administration/sign-in/verify-2fa/route.tsx',
        ),

        // Magic-link sign-in: request form
        route(
          'sign-in/magic-link',
          'routes/administration/sign-in/magic-link/route.tsx',
        ),

        // Magic-link sign-in: verify + confirm
        route(
          'sign-in/magic-link/verify',
          'routes/administration/sign-in/magic-link/verify/route.tsx',
        ),

        // Emergency sign-in link an Administrator issued: confirm (design 20f)
        route(
          'sign-in/emergency-link/verify',
          'routes/administration/sign-in/emergency-link/verify/route.tsx',
        ),

        // Google OAuth sign-in: start (POST) + callback
        route(
          'sign-in/google',
          'routes/administration/sign-in/google/route.ts',
        ),
        route(
          'sign-in/google/callback',
          'routes/administration/sign-in/google/callback/route.ts',
        ),

        // Passkey (WebAuthn) sign-in: usernameless/discoverable authentication
        route(
          'sign-in/passkey/generate-authentication-options',
          'routes/administration/sign-in/passkey/generate-authentication-options/route.ts',
        ),
        route(
          'sign-in/passkey/verify-authentication-response',
          'routes/administration/sign-in/passkey/verify-authentication-response/route.ts',
        ),
      ]),

      // Authenticated routes
      layout('routes/administration/__layout-authenticated/route.tsx', [
        // Dashboard
        index('routes/administration/_index/route.tsx'),

        // Saved list filters — action-only endpoint submitted by fetchers from
        // the admin list toolbars. Guards itself: the layout loader does not run
        // before a child action.
        route('filters', 'routes/administration/filters/route.ts'),

        // The article editor's edit hold (design 07g) — action-only, posted by
        // the editor; guards itself like the filters.
        route(
          'articles/:articleId/edit-hold',
          'routes/administration/articles/article/edit-hold/route.ts',
        ),
        // The article editor's autosave (design 24e) — action-only, posted by
        // the holding tab; guards itself like the edit hold.
        route(
          'articles/:articleId/save',
          'routes/administration/articles/article/save-article/route.ts',
        ),
        // The article editor's gallery (design 24b): each image change saves
        // on its own; guards itself like the save.
        route(
          'articles/:articleId/images',
          'routes/administration/articles/article/article-images/route.ts',
        ),
        // The issue editor's edit hold and autosave (design 26c), as the
        // article's.
        route(
          'archive/:issueId/edit-hold',
          'routes/administration/archive/issue/edit-hold/route.ts',
        ),
        route(
          'archive/:issueId/save',
          'routes/administration/archive/issue/save-issue/route.ts',
        ),

        // Sections
        layout('routes/administration/__layout-section/route.tsx', [
          // Articles (hlavní sekce s nested routes pro categories a tags)
          // Articles index (seznam článků)
          ...createAdminEntriesIntersection(
            {
              entry: 'article',
              id: 'articleId',
              name: 'articles',
              path: 'routes/administration/articles',
            },
            // Nested: Article Categories
            ...createAdminRecordSection({
              entry: 'category',
              id: 'categoryId',
              name: 'categories',
              path: 'routes/administration/articles/categories',
            }),

            // Nested: Article Tags
            ...createAdminRecordSection({
              entry: 'tag',
              id: 'tagId',
              name: 'tags',
              path: 'routes/administration/articles/tags',
            }),
          ),

          // Archive
          ...createAdminEntriesSection({
            entry: 'issue',
            id: 'issueId',
            name: 'archive',
            path: 'routes/administration/archive',
          }),

          // Podcasts
          ...createAdminEntriesSection(
            {
              entry: 'podcast',
              id: 'podcastId',
              name: 'podcasts',
              path: 'routes/administration/podcasts',
            },
            // Podcast Episodes
            ...createAdminEntriesSection({
              entry: 'episode',
              id: 'episodeId',
              name: 'episodes',
              path: 'routes/administration/podcasts/podcast/episodes',
            }),
          ),

          // Users
          ...createAdminEntriesSection(
            {
              entry: 'user',
              id: 'userId',
              name: 'users',
              path: 'routes/administration/users',
            },
            // Emergency sign-in link — action-only, the detail's dialog (28e)
            route(
              'emergency-link',
              'routes/administration/users/user/emergency-link/route.ts',
            ),
          ),

          // Authors
          ...createAdminEntriesSection({
            entry: 'author',
            id: 'authorId',
            name: 'authors',
            path: 'routes/administration/authors',
          }),

          // Settings of the signed-in account (design 29a)
          ...createAdminIntersection(
            {
              name: 'settings',
              path: 'routes/administration/settings',
            },
            // Old subpages: the loaders redirect to settings, the actions are
            // the dialogs' targets (design 29a–29d)
            route(
              'change-password',
              'routes/administration/settings/change-password/route.ts',
            ),
            route(
              'two-factor',
              'routes/administration/settings/two-factor/route.ts',
            ),
            // Identity check before changing sign-in methods (design 29d)
            route(
              'verify-identity/passkey/generate-authentication-options',
              'routes/administration/settings/verify-identity/passkey/generate-authentication-options/route.ts',
            ),
            route(
              'verify-identity/passkey/verify-authentication-response',
              'routes/administration/settings/verify-identity/passkey/verify-authentication-response/route.ts',
            ),
            route(
              'verify-identity/google',
              'routes/administration/settings/verify-identity/google/route.ts',
            ),
            route(
              'verify-identity/magic-link',
              'routes/administration/settings/verify-identity/magic-link/route.ts',
            ),

            // The profile photo (design 29b): saved on its own, cancellable
            route('photo', 'routes/administration/settings/photo/route.ts'),

            // Passkey removal + registration ceremony endpoints
            route(
              'passkeys',
              'routes/administration/settings/passkeys/route.ts',
            ),
            route(
              'passkeys/generate-registration-options',
              'routes/administration/settings/passkeys/generate-registration-options/route.ts',
            ),
            route(
              'passkeys/verify-registration-response',
              'routes/administration/settings/passkeys/verify-registration-response/route.ts',
            ),

            // Old profile addresses (design 30b)
            route(
              'profile/*',
              'routes/administration/settings/profile/route.ts',
            ),
          ),

          // Catch-all for non-existent sections
          route('*', 'routes/administration/404/route.tsx'),
        ]),
      ]),
    ]),
  ]),

  // Links route
  route('links', 'routes/links/route.tsx'),

  // Resource routes
  // Image variants are keyed by row id + version + variant name (e.g. "960.avif"
  // or "og.jpeg"); version in the path makes `immutable` caching safe.
  ...prefix('resources', [
    route(
      'article-image/:imageId/:version/:variant',
      'routes/resources/article-image/route.ts',
    ),
    route(
      'issue-cover/:coverId/:version/:variant',
      'routes/resources/issue-cover/route.ts',
    ),
    route(
      'podcast-cover/:coverId/:version/:variant',
      'routes/resources/podcast-cover/route.ts',
    ),
    route(
      'podcast-episode-cover/:coverId/:version/:variant',
      'routes/resources/podcast-episode-cover/route.ts',
    ),
    route(
      'user-image/:imageId/:version/:variant',
      'routes/resources/user-image/route.ts',
    ),
    route('env.js', 'routes/resources/env-script/route.ts'),
    route('admin-events', 'routes/resources/admin-events/route.ts'),
  ]),
] satisfies RouteConfig
