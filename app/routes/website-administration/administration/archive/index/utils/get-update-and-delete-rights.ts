import { getAuthorRights } from "~/utils/get-author-rights"

type Args = {
  userAuthorId: string
  userAuthorPermissions: {
    entity: string
    action: string
    access: string
    state: string
  }[]
  issueState: string
  issueAuthorId: string
}

export const getUpdateAndDeleteRights = ({
  userAuthorPermissions,
  userAuthorId,
  issueState,
  issueAuthorId,
}: Args) => {
  const [
    // entity: issue
    [
      // action: update
      [
        // access: own
        [hasUpdateOwnRight],
        // access: any
        [hasUpdateAnyRight],
      ],
      // action: delete
      [
        // access: own
        [hasDeleteOwnRight],
        // access: any
        [hasDeleteAnyRight],
      ],
    ],
  ] = getAuthorRights(userAuthorPermissions, {
    entities: ["issue"],
    actions: ["update", "delete"],
    access: ["own", "any"],
    states: [issueState],
    ownId: userAuthorId,
    targetId: issueAuthorId,
  })

  return {
    hasUpdateOwnRight,
    hasUpdateAnyRight,
    hasDeleteOwnRight,
    hasDeleteAnyRight,
  }
}
