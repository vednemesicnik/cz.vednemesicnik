import { describe, expect, test } from "vitest"

import { getAuthorRights } from "./get-author-rights"

describe("getAuthorRights", () => {
  test("should return true for matching permissions with 'article' entity", () => {
    const permissions = [
      { entity: "article", action: "update", access: "any", state: "draft" },
      { entity: "issue", action: "delete", access: "own", state: "published" },
    ]

    const options = {
      entities: ["article"],
      actions: ["update"],
      access: ["any"],
      states: ["draft"],
    }

    const [[[[hasArticleUpdateAnyDraftRight]]]] = getAuthorRights(
      permissions,
      options
    )

    expect(hasArticleUpdateAnyDraftRight).toEqual(true)
  })

  test("should return false for non-matching permissions with 'issue' entity", () => {
    const permissions = [
      { entity: "article", action: "update", access: "any", state: "draft" },
    ]

    const options = {
      entities: ["issue"],
      actions: ["delete"],
      access: ["own"],
      states: ["published"],
    }

    const [[[[hasIssueDeleteOwnPublishedRight]]]] = getAuthorRights(
      permissions,
      options
    )

    expect(hasIssueDeleteOwnPublishedRight).toEqual(false)
  })

  test("should handle no options and return true if any permission matches", () => {
    const permissions = [
      { entity: "article", action: "update", access: "any", state: "draft" },
      { entity: "issue", action: "delete", access: "own", state: "published" },
    ]

    const [[[[hasRight]]]] = getAuthorRights(permissions)

    expect(hasRight).toEqual(true)
  })

  test("should return true for own access with matching ids", () => {
    const permissions = [
      { entity: "article", action: "update", access: "own", state: "draft" },
    ]

    const options = {
      entities: ["article"],
      actions: ["update"],
      access: ["own"],
      states: ["draft"],
      ownId: "123",
      targetId: "123",
    }

    const [[[[hasArticleUpdateOwnDraftRight]]]] = getAuthorRights(
      permissions,
      options
    )

    expect(hasArticleUpdateOwnDraftRight).toEqual(true)
  })

  test("should return false for own access with non-matching ids", () => {
    const permissions = [
      { entity: "article", action: "update", access: "own", state: "draft" },
    ]

    const options = {
      entities: ["article"],
      actions: ["update"],
      access: ["own"],
      states: ["draft"],
      ownId: "123",
      targetId: "456",
    }

    const [[[[hasArticleUpdateOwnDraftRight]]]] = getAuthorRights(
      permissions,
      options
    )

    expect(hasArticleUpdateOwnDraftRight).toEqual(false)
  })
})
