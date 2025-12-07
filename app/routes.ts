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

  // Website Administration
  ...prefix("administration", [
    route(
      "sign-out",
      "routes/website-administration/administration/sign-out/route.ts"
    ),

    // Non-authenticated routes
    layout(
      "routes/website-administration/__layout-non-authenticated/route.tsx",
      [
        route(
          "sign-in",
          "routes/website-administration/administration/sign-in/route.tsx"
        ),
      ]
    ),

    // Authenticated routes
    layout("routes/website-administration/__layout-authenticated/route.tsx", [
      index("routes/website-administration/administration/index/route.tsx"),

      layout(
        "routes/website-administration/administration/__layout-sections/route.tsx",
        [
          // Archive Administration
          ...prefix("archive", [
            layout(
              "routes/website-administration/administration/archive/__layout/route.tsx",
              [
                index(
                  "routes/website-administration/administration/archive/_index/route.tsx"
                ),
                route(
                  "add-issue",
                  "routes/website-administration/administration/archive/add-issue/route.tsx"
                ),
                ...prefix(":issueId", [
                  layout(
                    "routes/website-administration/administration/archive/issue/__layout/route.tsx",
                    [
                      index(
                        "routes/website-administration/administration/archive/issue/_index/route.tsx"
                      ),
                      route(
                        "edit-issue",
                        "routes/website-administration/administration/archive/issue/edit-issue/route.tsx"
                      ),
                    ]
                  ),
                ]),
              ]
            ),
          ]),

          // Podcast Administration
          ...prefix("podcasts", [
            layout(
              "routes/website-administration/administration/podcasts/__layout/route.tsx",
              [
                index(
                  "routes/website-administration/administration/podcasts/_index/route.tsx"
                ),
                route(
                  "add-podcast",
                  "routes/website-administration/administration/podcasts/add-podcast/route.tsx"
                ),
                ...prefix(":podcastId", [
                  layout(
                    "routes/website-administration/administration/podcasts/podcast/__layout/route.tsx",
                    [
                      index(
                        "routes/website-administration/administration/podcasts/podcast/_index/route.tsx"
                      ),
                      route(
                        "edit-podcast",
                        "routes/website-administration/administration/podcasts/podcast/edit-podcast/route.tsx"
                      ),
                    ]
                  ),
                ]),

                // Podcast Episode Administration
                ...prefix(":podcastId", [
                  layout(
                    "routes/website-administration/administration/podcasts/episodes/__layout/route.tsx",
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
                      ...prefix(":episodeId", [
                        layout(
                          "routes/website-administration/administration/podcasts/episodes/links/__layout/route.tsx",
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
                      ]),
                    ]
                  ),
                ]),
              ]
            ),
          ]),

          // User Administration
          ...prefix("users", [
            layout(
              "routes/website-administration/administration/users/__layout/route.tsx",
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
          ]),

          // Editorial Board Administration
          ...prefix("editorial-board", [
            layout(
              "routes/website-administration/administration/editorial-board/__layout/route.tsx",
              [
                index(
                  "routes/website-administration/administration/editorial-board/index/route.tsx"
                ),

                ...prefix("members", [
                  layout(
                    "routes/website-administration/administration/editorial-board/members/__layout/route.tsx",
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
                ]),

                ...prefix("positions", [
                  layout(
                    "routes/website-administration/administration/editorial-board/positions/__layout/route.tsx",
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
                ]),
              ]
            ),
          ]),

          // Settings Administration
          ...prefix("settings", [
            layout(
              "routes/website-administration/administration/settings/__layout/route.tsx",
              [
                index(
                  "routes/website-administration/administration/settings/index/route.tsx"
                ),

                ...prefix("profile", [
                  layout(
                    "routes/website-administration/administration/settings/profile/__layout/route.tsx",
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
                ]),
              ]
            ),
          ]),
        ]
      ),
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
