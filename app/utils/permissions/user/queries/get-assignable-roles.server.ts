import { prisma } from "~/utils/db.server"

import type { UserPermissionContext } from "../context/get-user-permission-context.server"

type GetAssignableRolesOptions = {
  /** User ID of the user being edited (for edit context only) */
  targetUserId?: string
}

/**
 * Fetches roles that the current user can assign to other users.
 *
 * Role assignment rules:
 * - Owner can assign roles BELOW their level (gt: level > 1) → Administrator, Member
 * - Non-owners can assign roles AT OR BELOW their level (gte) → their role + lower roles
 *
 * Special case for Owner role (one Owner at a time policy):
 * - If target user IS the Owner → return ONLY Owner role (cannot change owner's role)
 *
 * Examples:
 * - Owner (level 1) assigning to non-owner → Administrator, Member (excludes Owner)
 * - Owner assigning to owner account → ONLY Owner
 * - Administrator (level 2) can assign: Administrator, Member
 * - Member (level 3) can assign: Member
 */
export async function getAssignableRoles(
  context: UserPermissionContext,
  options: GetAssignableRolesOptions = {}
) {
  const { targetUserId } = options

  // Special case: If target is the Owner account - can only assign Owner role
  if (targetUserId !== undefined) {
    // Fetch the owner user to check if target is the owner
    const ownerUser = await prisma.user.findFirst({
      where: {
        role: { name: "owner" },
      },
      select: { id: true },
    })

    if (ownerUser && targetUserId === ownerUser.id) {
      // Target is the owner - return only Owner role
      return prisma.userRole.findMany({
        where: { name: "owner" },
        select: {
          id: true,
          name: true,
          level: true,
        },
      })
    }
  }

  // Determine level comparison based on current user's role
  const isContextUserOwner = context.roleName === "owner"

  // Owner uses gt (greater than) to exclude owner role from assignable roles
  // Non-owners use gte (greater than or equal) to include their own role level
  return prisma.userRole.findMany({
    where: {
      level: isContextUserOwner
        ? { gt: context.roleLevel }
        : { gte: context.roleLevel },
    },
    select: {
      id: true,
      name: true,
      level: true,
    },
    orderBy: {
      level: "asc",
    },
  })
}
