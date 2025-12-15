// noinspection JSUnusedGlobalSymbols

import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@react-router/dev/routes"

import { createAdminEntriesSection } from "../utils/create-admin-entries-section"
import { createAdminIntersection } from "../utils/create-admin-intersection"

export default [
  // Health check route
  route("health", "routes/health/route.ts"),

  // Website
  layout("routes/website/__layout/route.tsx", [
    // Home route
    index("routes/website/_index/route.tsx"),

    // Articles routes
    route("articles", "routes/website/articles/route.tsx"),

    // Podcasts routes
    ...prefix("podcasts", [
      layout("routes/website/podcasts/layout/route.tsx", [
        index("routes/website/podcasts/index/route.tsx"),
        route(
          ":podcastSlug",
          "routes/website/podcasts/podcast/splat/route.tsx",
          [
            index("routes/website/podcasts/podcast/index/route.tsx"),
            route(
              ":episodeSlug",
              "routes/website/podcasts/podcast/episode/splat/route.tsx",
              [index("routes/website/podcasts/podcast/episode/index/route.tsx")]
            ),
          ]
        ),
      ]),
    ]),

    // Archive routes
    ...prefix("archive", [
      index("routes/website/archive/index/route.tsx"),
      route(":fileName", "routes/website/archive/issue-pdf/route.ts"),
    ]),

    // Editorial Board routes
    route("editorial-board", "routes/website/editorial-board/route.tsx"),

    // Organization routes
    route("organization", "routes/website/organization/route.tsx"),

    // Support routes
    route("support", "routes/website/support/route.tsx"),
  ]),

  // Administration
  ...prefix("administration", [
    // Sign out
    route("sign-out", "routes/administration/sign-out/route.ts"),

    // Non-authenticated routes
    layout("routes/administration/__layout-non-authenticated/route.tsx", [
      // Sign in
      route("sign-in", "routes/administration/sign-in/route.tsx"),
    ]),

    // Authenticated routes
    layout("routes/administration/__layout-authenticated/route.tsx", [
      // Dashboard
      index("routes/administration/_index/route.tsx"),

      // Sections
      layout("routes/administration/__layout-section/route.tsx", [
        // Archive
        ...createAdminEntriesSection({
          name: "archive",
          entry: "issue",
          path: "routes/administration/archive",
          id: "issueId",
        }),

        // Podcasts
        ...createAdminEntriesSection(
          {
            name: "podcasts",
            entry: "podcast",
            path: "routes/administration/podcasts",
            id: "podcastId",
          },
          // Podcast Episodes
          ...createAdminEntriesSection(
            {
              name: "episodes",
              entry: "episode",
              path: "routes/administration/podcasts/podcast/episodes",
              id: "episodeId",
            },
            // Episode Links
            ...createAdminEntriesSection({
              name: "links",
              entry: "link",
              path: "routes/administration/podcasts/podcast/episodes/episode/links",
              id: "linkId",
            })
          )
        ),

        // Editorial Board
        ...createAdminIntersection(
          {
            name: "editorial-board",
            path: "routes/administration/editorial-board",
          },
          ...createAdminEntriesSection({
            name: "positions",
            path: "routes/administration/editorial-board/positions",
            entry: "position",
            id: "positionId",
          }),
          ...createAdminEntriesSection({
            name: "members",
            path: "routes/administration/editorial-board/members",
            entry: "member",
            id: "memberId",
          })
        ),

        // Users
        ...createAdminEntriesSection({
          name: "users",
          entry: "user",
          path: "routes/administration/users",
          id: "userId",
        }),

        // Settings
        ...createAdminIntersection(
          {
            name: "settings",
            path: "routes/administration/settings",
          },
          // Profile Settings
          ...createAdminIntersection(
            {
              name: "profile",
              path: "routes/administration/settings/profile",
            },
            route(
              "change-password",
              "routes/administration/settings/profile/change-password/route.tsx"
            )
          )
        ),
      ]),
    ]),
  ]),

  // Links route
  route("links", "routes/links/route.tsx"),

  // Issue PDF route for backward compatibility
  route("pdf/:fileName", "routes/pdf/issue-pdf/route.ts"),

  // Resource routes
  ...prefix("resources", [
    route("issue-cover/:id", "routes/resources/issue-cover/route.ts"),
    route(
      "podcast-cover/:podcastId",
      "routes/resources/podcast-cover/route.ts"
    ),
    route(
      "podcast-episode-cover/:episodeId",
      "routes/resources/podcast-episode-cover/route.ts"
    ),
    route("user-image/:userId", "routes/resources/user-image/route.ts"),
    route("env.js", "routes/resources/env-script/route.ts"),
  ]),
] satisfies RouteConfig
