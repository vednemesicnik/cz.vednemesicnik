import { getAuthorRights } from "~/utils/get-author-rights"

type Args = {
  permissions: {
    entity: string
    action: string
    access: string
    state: string
  }[]
}

export const getCreateRights = ({ permissions }: Args) => {
  const [
    // entity: issue
    [
      // action: create
      [
        // access: own
        [hasCreateOwnDraftRight, hasCreateOwnPublishedRight],
        // access: any
        [hasCreateAnyDraftRight, hasCreateAnyPublishedRight],
      ],
    ],
  ] = getAuthorRights(permissions, {
    entities: ["issue"],
    actions: ["create"],
    access: ["own", "any"],
    states: ["draft", "published"],
  })

  return {
    hasCreateOwnDraftRight,
    hasCreateOwnPublishedRight,
    hasCreateAnyDraftRight,
    hasCreateAnyPublishedRight,
  }
}
