import { describe, expect, test } from "vitest"

import { getUserRights } from "./get-user-rights"

describe("getUserRights", () => {
  test("should return true for matching permissions with 'author' entity", () => {
    const permissions = [
      { entity: "author", action: "update", access: "any" },
      { entity: "user", action: "delete", access: "own" },
    ]

    const options = {
      entities: ["author"],
      actions: ["update"],
      access: ["any"],
    }

    const [[[hasAuthorUpdateAnyRight]]] = getUserRights(permissions, options)

    expect(hasAuthorUpdateAnyRight).toEqual(true)
  })

  test("should return false for non-matching permissions with 'user' entity", () => {
    const permissions = [{ entity: "author", action: "update", access: "any" }]

    const options = {
      entities: ["user"],
      actions: ["delete"],
      access: ["own"],
    }

    const [[[hasUserDeleteOwnRight]]] = getUserRights(permissions, options)

    expect(hasUserDeleteOwnRight).toEqual(false)
  })

  test("should handle no options when permissions filtered by database query", () => {
    const permissions = [{ entity: "author", action: "update", access: "any" }]

    const [[[hasRight]]] = getUserRights(permissions)

    expect(hasRight).toEqual(true)
  })
})
