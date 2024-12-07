// noinspection JSUnusedGlobalSymbols

import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@react-router/dev/routes"

export default [
  // Health check route
  route("health", "routes/health/route.ts"),

  // Initial route
  index("routes/_index/route.tsx"),

  // Articles routes
  route("articles", "routes/articles/route.tsx"),

  // Editorial Board routes
  route("editorial-board", "routes/editorial-board/route.tsx"),

  // Organization routes
  route("organization", "routes/organization/route.tsx"),

  // Support routes
  route("support", "routes/support/route.tsx"),

  // Archive routes
  ...prefix("archive", [
    index("routes/archive/index/route.tsx"),
    route(":fileName", "routes/archive/issue-pdf/route.ts"),
  ]),

  // Podcasts routes
  ...prefix("podcasts", [
    layout("routes/podcasts/layout/route.tsx", [
      index("routes/podcasts/index/route.tsx"),
      route(":podcastSlug", "routes/podcasts/podcast/splat/route.tsx", [
        index("routes/podcasts/podcast/index/route.tsx"),
        route(
          ":episodeSlug",
          "routes/podcasts/podcast/episode/splat/route.tsx",
          [index("routes/podcasts/podcast/episode/index/route.tsx")]
        ),
      ]),
    ]),
  ]),

  // Administration routes
  ...prefix("administration", [
    route("sign-in", "routes/administration/sign-in/route.tsx"),
    route("sign-out", "routes/administration/sign-out/route.ts"),

    layout("routes/administration/layout/route.tsx", [
      index("routes/administration/index/route.tsx"),

      // Archive Administration
      ...prefix("archive", [
        index("routes/administration/archive/index/route.tsx"),
        route("add-issue", "routes/administration/archive/add-issue/route.tsx"),
        route(
          "edit-issue/:issueId",
          "routes/administration/archive/edit-issue/route.tsx"
        ),
      ]),

      // Podcast Administration
      ...prefix("podcasts", [
        index("routes/administration/podcasts/index/route.tsx"),
        route(
          "add-podcast",
          "routes/administration/podcasts/add-podcast/route.tsx"
        ),
        route(
          "edit-podcast/:podcastId",
          "routes/administration/podcasts/edit-podcast/route.tsx"
        ),

        // Podcast Episode Administration
        ...prefix(":podcastId", [
          index("routes/administration/podcasts/episodes/index/route.tsx"),
          route(
            "add-episode",
            "routes/administration/podcasts/episodes/add-episode/route.tsx"
          ),
          route(
            "edit-episode/:episodeId",
            "routes/administration/podcasts/episodes/edit-episode/route.tsx"
          ),

          // Podcast Episode Link Administration
          ...prefix(":episodeId", [
            index(
              "routes/administration/podcasts/episodes/links/index/route.tsx"
            ),
            route(
              "add-link",
              "routes/administration/podcasts/episodes/links/add-link/route.tsx"
            ),
            route(
              "edit-link/:linkId",
              "routes/administration/podcasts/episodes/links/edit-link/route.tsx"
            ),
          ]),
        ]),
      ]),

      // User Administration
      ...prefix("users", [
        index("routes/administration/users/index/route.tsx"),
        route("add-user", "routes/administration/users/add-user/route.tsx"),
        route(
          "edit-user/:userId",
          "routes/administration/users/edit-user/route.tsx"
        ),
      ]),

      // Editorial Board Administration
      ...prefix("editorial-board", [
        index("routes/administration/editorial-board/index/route.tsx"),
        ...prefix("members", [
          index(
            "routes/administration/editorial-board/members/index/route.tsx"
          ),
          route(
            "add-member",
            "routes/administration/editorial-board/members/add-member/route.tsx"
          ),
          route(
            "edit-member/:memberId",
            "routes/administration/editorial-board/members/edit-member/route.tsx"
          ),
        ]),
        ...prefix("positions", [
          index(
            "routes/administration/editorial-board/positions/index/route.tsx"
          ),
          route(
            "add-position",
            "routes/administration/editorial-board/positions/add-position/route.tsx"
          ),
          route(
            "edit-position/:positionId",
            "routes/administration/editorial-board/positions/edit-position/route.tsx"
          ),
        ]),
      ]),

      // Settings Administration
      ...prefix("settings", [
        index("routes/administration/settings/index/route.tsx"),
        ...prefix("profile", [
          index("routes/administration/settings/profile/index/route.tsx"),
          route(
            "change-password",
            "routes/administration/settings/profile/change-password/route.tsx"
          ),
        ]),
      ]),
    ]),
  ]),

  // Resource routes
  ...prefix("resources", [
    route("issue-cover/:issueId", "routes/resources/issue-cover/route.ts"),
    route(
      "podcast-cover/:podcastId",
      "routes/resources/podcast-cover/route.ts"
    ),
    route(
      "podcast-episode-cover/:episodeId",
      "routes/resources/podcast-episode-cover/route.ts"
    ),
    route("user-image/:userId", "routes/resources/user-image/route.ts"),
  ]),
] satisfies RouteConfig