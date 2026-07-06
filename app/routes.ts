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

export default [
  // Health check route
  route('health', 'routes/health/route.ts'),

  // Website
  layout('routes/website/__layout/route.tsx', [
    // Home route
    index('routes/website/_index/route.tsx'),

    // Articles routes
    ...prefix('articles', [
      layout('routes/website/articles/__layout/route.tsx', [
        index('routes/website/articles/_index/route.tsx'),
        route(':articleSlug', 'routes/website/articles/article/route.tsx'),
      ]),
    ]),

    // Podcasts routes
    ...prefix('podcasts', [
      layout('routes/website/podcasts/__layout/route.tsx', [
        index('routes/website/podcasts/_index/route.tsx'),
        ...prefix(':podcastSlug', [
          layout('routes/website/podcasts/podcast/__layout/route.tsx', [
            index('routes/website/podcasts/podcast/_index/route.tsx'),
            route(
              ':episodeSlug',
              'routes/website/podcasts/podcast/episode/route.tsx',
            ),
          ]),
        ]),
      ]),
    ]),

    // Archive routes
    ...prefix('archive', [
      index('routes/website/archive/_index/route.tsx'),
      route(':fileName', 'routes/website/archive/issue-pdf/route.tsx'),
    ]),

    // Editorial Board routes
    route('editorial-board', 'routes/website/editorial-board/route.tsx'),

    // Organization routes
    route('organization', 'routes/website/organization/route.tsx'),

    // Support routes
    route('support', 'routes/website/support/route.tsx'),

    // Grants routes
    ...prefix('grants', [
      layout('routes/website/grants/__layout/route.tsx', [
        index('routes/website/grants/_index/route.tsx'),
        route(':grantSlug', 'routes/website/grants/grant/route.tsx'),
      ]),
    ]),
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
      ]),

      // Authenticated routes
      layout('routes/administration/__layout-authenticated/route.tsx', [
        // Dashboard
        index('routes/administration/_index/route.tsx'),

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
            ...createAdminEntriesSection({
              entry: 'category',
              id: 'categoryId',
              name: 'categories',
              path: 'routes/administration/articles/categories',
            }),

            // Nested: Article Tags
            ...createAdminEntriesSection({
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
            ...createAdminEntriesSection(
              {
                entry: 'episode',
                id: 'episodeId',
                name: 'episodes',
                path: 'routes/administration/podcasts/podcast/episodes',
              },
              // Episode Links
              ...createAdminEntriesSection({
                entry: 'link',
                id: 'linkId',
                name: 'links',
                path: 'routes/administration/podcasts/podcast/episodes/episode/links',
              }),
            ),
          ),

          // Editorial Board
          ...createAdminIntersection(
            {
              name: 'editorial-board',
              path: 'routes/administration/editorial-board',
            },
            ...createAdminEntriesSection({
              entry: 'position',
              id: 'positionId',
              name: 'positions',
              path: 'routes/administration/editorial-board/positions',
            }),
            ...createAdminEntriesSection({
              entry: 'member',
              id: 'memberId',
              name: 'members',
              path: 'routes/administration/editorial-board/members',
            }),
          ),

          // Users
          ...createAdminEntriesSection({
            entry: 'user',
            id: 'userId',
            name: 'users',
            path: 'routes/administration/users',
          }),

          // Authors
          ...createAdminEntriesSection({
            entry: 'author',
            id: 'authorId',
            name: 'authors',
            path: 'routes/administration/authors',
          }),

          // Settings
          ...createAdminIntersection(
            {
              name: 'settings',
              path: 'routes/administration/settings',
            },
            // Profile Settings
            ...createAdminIntersection(
              {
                name: 'profile',
                path: 'routes/administration/settings/profile',
              },
              route(
                'change-password',
                'routes/administration/settings/profile/change-password/route.tsx',
              ),
              route(
                'two-factor',
                'routes/administration/settings/profile/two-factor/route.tsx',
              ),
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
  ]),
] satisfies RouteConfig
