import { getAuthorRights } from "~/utils/permissions/core/get-author-rights"
import type {
	AuthorPermissionEntity,
	AuthorPermissionAction,
	AuthorPermissionAccess,
	ContentState,
	AuthorRoleName,
} from "@generated/prisma/enums"

type AuthorPermission = {
	entity: AuthorPermissionEntity
	action: AuthorPermissionAction
	access: AuthorPermissionAccess
	state: ContentState
}

type UseAuthorPermissionOptions = {
	authorId: string
	roleName: AuthorRoleName
	roleLevel: number
	permissions: AuthorPermission[]
}

export function useAuthorPermission(options: UseAuthorPermissionOptions) {
	const { authorId, permissions } = options

	return {
		can: (config: {
			entity: AuthorPermissionEntity
			action: AuthorPermissionAction
			access?: AuthorPermissionAccess[]
			state?: ContentState
			targetAuthorId?: string
		}): { hasOwn: boolean; hasAny: boolean; hasPermission: boolean } => {
			const access = config.access ?? ["own", "any"]
			const states = config.state ? [config.state] : ["*"]

			const rights = getAuthorRights(permissions, {
				entities: [config.entity],
				actions: [config.action],
				access,
				states,
				ownId: authorId,
				targetId: config.targetAuthorId,
			})

			// rights structure: [entities][actions][access][states]
			// With 1 entity, 1 action, 2 access levels, 1 state:
			// rights[0][0][0][0] = hasOwn (for the first access level, typically "own")
			// rights[0][0][1][0] = hasAny (for the second access level, typically "any")
			const hasOwn = rights[0]?.[0]?.[0]?.[0] ?? false
			const hasAny = rights[0]?.[0]?.[1]?.[0] ?? false

			return {
				hasOwn,
				hasAny,
				hasPermission: hasOwn || hasAny,
			}
		},
	}
}