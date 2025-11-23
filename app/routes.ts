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

  // Website - Administration
  layout("routes/website-administration/__layout/route.tsx", [
    // Administration routes
    ...prefix("administration", [
      route(
        "sign-in",
        "routes/website-administration/administration/sign-in/route.tsx"
      ),
      route(
        "sign-out",
        "routes/website-administration/administration/sign-out/route.ts"
      ),

      layout("routes/website-administration/administration/layout/route.tsx", [
        index("routes/website-administration/administration/index/route.tsx"),

        // Archive Administration
        route(
          "archive",
          "routes/website-administration/administration/archive/splat/route.tsx",
          [
            index(
              "routes/website-administration/administration/archive/index/route.tsx"
            ),
            route(
              "add-issue",
              "routes/website-administration/administration/archive/add-issue/route.tsx"
            ),
            route(
              "edit-issue/:issueId",
              "routes/website-administration/administration/archive/edit-issue/route.tsx"
            ),
          ]
        ),

        // Podcast Administration
        route(
          "podcasts",
          "routes/website-administration/administration/podcasts/splat/route.tsx",
          [
            index(
              "routes/website-administration/administration/podcasts/index/route.tsx"
            ),
            route(
              "add-podcast",
              "routes/website-administration/administration/podcasts/add-podcast/route.tsx"
            ),
            route(
              "edit-podcast/:podcastId",
              "routes/website-administration/administration/podcasts/edit-podcast/route.tsx"
            ),

            // Podcast Episode Administration
            route(
              ":podcastId",
              "routes/website-administration/administration/podcasts/episodes/splat/route.tsx",
              [
                index(
                  "routes/website-administration/administration/podcasts/episodes/index/route.tsx"
                ),
                route(
                  "add-episode",
                  "routes/website-administration/administration/podcasts/episodes/add-episode/route.tsx"
                ),
                route(
                  "edit-episode/:episodeId",
                  "routes/website-administration/administration/podcasts/episodes/edit-episode/route.tsx"
                ),

                // Podcast Episode Link Administration
                route(
                  ":episodeId",
                  "routes/website-administration/administration/podcasts/episodes/links/splat/route.tsx",
                  [
                    index(
                      "routes/website-administration/administration/podcasts/episodes/links/index/route.tsx"
                    ),
                    route(
                      "add-link",
                      "routes/website-administration/administration/podcasts/episodes/links/add-link/route.tsx"
                    ),
                    route(
                      "edit-link/:linkId",
                      "routes/website-administration/administration/podcasts/episodes/links/edit-link/route.tsx"
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),

        // User Administration
        route(
          "users",
          "routes/website-administration/administration/users/splat/route.tsx",
          [
            index(
              "routes/website-administration/administration/users/index/route.tsx"
            ),
            route(
              "add-user",
              "routes/website-administration/administration/users/add-user/route.tsx"
            ),
            route(
              "edit-user/:userId",
              "routes/website-administration/administration/users/edit-user/route.tsx"
            ),
          ]
        ),

        // Editorial Board Administration
        route(
          "editorial-board",
          "routes/website-administration/administration/editorial-board/splat/route.tsx",
          [
            index(
              "routes/website-administration/administration/editorial-board/index/route.tsx"
            ),
            route(
              "members",
              "routes/website-administration/administration/editorial-board/members/splat/route.tsx",
              [
                index(
                  "routes/website-administration/administration/editorial-board/members/index/route.tsx"
                ),
                route(
                  "add-member",
                  "routes/website-administration/administration/editorial-board/members/add-member/route.tsx"
                ),
                route(
                  "edit-member/:memberId",
                  "routes/website-administration/administration/editorial-board/members/edit-member/route.tsx"
                ),
              ]
            ),
            route(
              "positions",
              "routes/website-administration/administration/editorial-board/positions/splat/route.tsx",
              [
                index(
                  "routes/website-administration/administration/editorial-board/positions/index/route.tsx"
                ),
                route(
                  "add-position",
                  "routes/website-administration/administration/editorial-board/positions/add-position/route.tsx"
                ),
                route(
                  "edit-position/:positionId",
                  "routes/website-administration/administration/editorial-board/positions/edit-position/route.tsx"
                ),
              ]
            ),
          ]
        ),

        // Settings Administration
        route(
          "settings",
          "routes/website-administration/administration/settings/splat/route.tsx",
          [
            index(
              "routes/website-administration/administration/settings/index/route.tsx"
            ),
            route(
              "profile",
              "routes/website-administration/administration/settings/profile/splat/route.tsx",
              [
                index(
                  "routes/website-administration/administration/settings/profile/index/route.tsx"
                ),
                route(
                  "change-password",
                  "routes/website-administration/administration/settings/profile/change-password/route.tsx"
                ),
              ]
            ),
          ]
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
    route("env-script", "routes/resources/env-script/route.ts"),
  ]),
] satisfies RouteConfig
