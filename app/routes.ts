// noinspection JSUnusedGlobalSymbols
// import { flatRoutes } from "@remix-run/fs-routes"
// export default flatRoutes()

import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@remix-run/route-config"

export default [
  // Health check route
  route("health", "routes/health/route.ts"),

  // Public routes
  index("routes/_index/route.tsx"),
  route("articles", "routes/articles/route.tsx"),
  route("editorial-board", "routes/editorial-board/route.tsx"),
  route("organization", "routes/organization/route.tsx"),
  route("support", "routes/support/route.tsx"),
  ...prefix("archive", [
    index("routes/archive._index/route.tsx"),
    route(":fileName", "routes/archive.$fileName/route.ts"),
  ]),
  ...prefix("podcasts", [
    layout("routes/podcasts/route.tsx", [
      index("routes/podcasts._index/route.tsx"),
      ...prefix(":podcastSlug", [
        layout("routes/podcasts.$podcastSlug/route.tsx", [
          index("routes/podcasts.$podcastSlug._index/route.tsx"),
          layout("routes/podcasts.$podcastSlug.$episodeSlug/route.tsx", [
            route(
              ":episodeSlug",
              "routes/podcasts.$podcastSlug.$episodeSlug._index/route.tsx"
            ),
          ]),
        ]),
      ]),
    ]),
  ]),

  // Administration routes
  ...prefix("administration", [
    layout("routes/administration/layout/route.tsx", [
      index("routes/administration/index/route.tsx"),

      // Archive Administration
      ...prefix("archive", [
        index("routes/administration.archive._index/route.tsx"),
        route(
          "add-issue",
          "routes/administration.archive.add-archived-issue/route.tsx"
        ),
        route(
          "edit-issue/:id",
          "routes/administration.archive.edit-archived-issue.$id/route.tsx"
        ),
      ]),

      // Podcast Administration
      ...prefix("podcasts", [
        index("routes/administration.podcasts._index/route.tsx"),
        route(
          "add-podcast",
          "routes/administration.podcasts.add-podcast/route.tsx"
        ),
        route(
          "edit-podcast/:podcastId",
          "routes/administration.podcasts.edit-podcast.$podcastId/route.tsx"
        ),

        // Podcast Episode Administration
        ...prefix(":podcastId", [
          index("routes/administration.podcasts.$podcastId._index/route.tsx"),
          route(
            "add-episode",
            "routes/administration.podcasts.$podcastId.add-episode/route.tsx"
          ),
          route(
            "edit-episode/:episodeId",
            "routes/administration.podcasts.$podcastId.edit-episode.$episodeId/route.tsx"
          ),

          // Podcast Episode Link Administration
          ...prefix(":episodeId", [
            index(
              "routes/administration.podcasts.$podcastId.$episodeId._index/route.tsx"
            ),
            route(
              "add-link",
              "routes/administration.podcasts.$podcastId.$episodeId.add-link/route.tsx"
            ),
            route(
              "edit-link/:linkId",
              "routes/administration.podcasts.$podcastId.$episodeId.edit-link.$linkId/route.tsx"
            ),
          ]),
        ]),
      ]),

      // User Administration
      ...prefix("users", [
        index("routes/administration.users._index/route.tsx"),
        route("add-user", "routes/administration.users.add-user/route.tsx"),
        route(
          "edit-user/:userId",
          "routes/administration.users.edit-user.$userId/route.tsx"
        ),
      ]),

      // Editorial Board Administration
      ...prefix("editorial-board", [
        index("routes/administration.editorial-board._index/route.tsx"),
        ...prefix("members", [
          index(
            "routes/administration.editorial-board.members._index/route.tsx"
          ),
          route(
            "add-member",
            "routes/administration.editorial-board.members.add-member/route.tsx"
          ),
          route(
            "edit-member/:id",
            "routes/administration.editorial-board.members.edit-member.$id/route.tsx"
          ),
        ]),
        ...prefix("positions", [
          index(
            "routes/administration.editorial-board.positions._index/route.tsx"
          ),
          route(
            "add-position",
            "routes/administration.editorial-board.positions.add-position/route.tsx"
          ),
          route(
            "edit-position/:id",
            "routes/administration.editorial-board.positions.edit-position.$id/route.tsx"
          ),
        ]),
      ]),

      // Settings Administration
      ...prefix("settings", [
        index("routes/administration.settings._index/route.tsx"),
        route(
          "profile",
          "routes/administration.settings.profile._index/route.tsx"
        ),
        route(
          "profile/change-password",
          "routes/administration.settings.profile.change-password/route.tsx"
        ),
      ]),
    ]),
    route("sign-in", "routes/administration_.sign-in._index/route.tsx"),
    route("sign-out", "routes/administration.sign-out/route.ts"),
  ]),

  // Resource routes
  ...prefix("resources", [
    route("issue-cover/:id", "routes/resources.issue-cover.$id.ts"),
    route("podcast-cover/:id", "routes/resources.podcast-cover.$id.ts"),
    route(
      "podcast-episode-cover/:id",
      "routes/resources.podcast-episode-cover.$id.ts"
    ),
    route("user-image/:id", "routes/resources.user-image.$id.ts"),
  ]),
] satisfies RouteConfig
