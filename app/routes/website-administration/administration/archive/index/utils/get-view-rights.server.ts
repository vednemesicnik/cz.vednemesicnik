import { getAuthorRights } from "~/utils/get-author-rights"

type Args = {
  permissions: {
    entity: string
    action: string
    access: string
    state: string
  }[]
}

export const getViewRights = ({ permissions }: Args) => {
  const [
    // entity: issue
    [
      // action: view
      [
        // access: own
        [
          hasViewOwnDraftIssueRight,
          hasViewOwnPublishedIssueRight,
          hasViewOwnArchivedIssueRight,
        ],
        // access: any
        [
          hasViewAnyDraftIssueRight,
          hasViewAnyPublishedIssueRight,
          hasViewAnyArchivedIssueRight,
        ],
      ],
    ],
  ] = getAuthorRights(permissions, {
    entities: ["issue"],
    actions: ["view"],
    access: ["own", "any"],
    states: ["draft", "published", "archived"],
  })

  return {
    hasViewOwnDraftIssueRight,
    hasViewOwnPublishedIssueRight,
    hasViewOwnArchivedIssueRight,
    hasViewAnyDraftIssueRight,
    hasViewAnyPublishedIssueRight,
    hasViewAnyArchivedIssueRight,
  }
}
