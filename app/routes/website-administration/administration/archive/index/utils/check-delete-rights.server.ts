import { invariantResponse } from "@epic-web/invariant"

import { getAuthorRights } from "~/utils/get-author-rights"

type Args = {
  author: {
    id: string
    permissions: {
      entity: string
      action: string
      access: string
      state: string
    }[]
  }
  issue: {
    state: string
    authorId: string
  }
}

export const checkDeleteRights = ({ author, issue }: Args) => {
  const [
    // entity: issue
    [
      // action: delete
      [
        // access: own
        [hasDeleteOwnIssueRight],
        // access: any
        [hasDeleteAnyIssueRight],
      ],
    ],
  ] = getAuthorRights(author.permissions, {
    entities: ["issue"],
    actions: ["delete"],
    access: ["own", "any"],
    states: [issue.state],
    ownId: author.id,
    targetId: issue.authorId,
  })

  invariantResponse(
    hasDeleteAnyIssueRight || hasDeleteOwnIssueRight,
    "You do not have the permission to delete the issue."
  )
}
