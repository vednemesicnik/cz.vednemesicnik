import { type Permission } from "@prisma/client"

// access: "own" | "any"
// action: "create" | "read" | "update" | "delete" | "publish"

type Permissions = Pick<Permission, "access" | "action">[]

export const canReadAny = (permissions: Permissions) => {
  return permissions.some(
    (permission) => permission.action === "read" && permission.access === "any"
  )
}

export const canReadOwn = (permissions: Permissions) => {
  return permissions.some(
    (permission) => permission.action === "read" && permission.access === "own"
  )
}

export const canRead = (permissions: Permissions) => {
  return {
    canReadAny: canReadAny(permissions),
    canReadOwn: canReadOwn(permissions),
  }
}

export const canCreateAny = (permissions: Permissions) => {
  return permissions.some(
    (permission) =>
      permission.action === "create" && permission.access === "any"
  )
}

export const canCreateOwn = (permissions: Permissions) => {
  return permissions.some(
    (permission) =>
      permission.action === "create" && permission.access === "own"
  )
}

export const canCreate = (permissions: Permissions) => {
  return {
    canCreateAny: canCreateAny(permissions),
    canCreateOwn: canCreateOwn(permissions),
  }
}

export const canUpdateAny = (permissions: Permissions) => {
  return permissions.some(
    (permission) =>
      permission.action === "update" && permission.access === "any"
  )
}

export const canUpdateOwn = (
  permissions: Permissions,
  userId: string,
  authorId: string
) => {
  return permissions.some(
    (permission) =>
      permission.action === "update" &&
      permission.access === "own" &&
      userId === authorId
  )
}

export const canUpdate = (
  permissions: Permissions,
  userId: string,
  authorId: string
) => {
  return {
    canUpdateAny: canUpdateAny(permissions),
    canUpdateOwn: canUpdateOwn(permissions, userId, authorId),
  }
}

export const canDeleteAny = (permissions: Permissions) => {
  return permissions.some(
    (permission) =>
      permission.action === "delete" && permission.access === "any"
  )
}

export const canDeleteOwn = (
  permissions: Permissions,
  userId: string,
  authorId: string
) => {
  return permissions.some(
    (permission) =>
      permission.action === "delete" &&
      permission.access === "own" &&
      userId === authorId
  )
}

export const canDelete = (
  permissions: Permissions,
  userId: string,
  authorId: string
) => {
  return {
    canDeleteAny: canDeleteAny(permissions),
    canDeleteOwn: canDeleteOwn(permissions, userId, authorId),
  }
}

export const canPublishAny = (permissions: Permissions) => {
  return permissions.some(
    (permission) =>
      permission.action === "publish" && permission.access === "any"
  )
}

export const canPublishOwn = (
  permissions: Permissions,
  userId: string,
  authorId: string
) => {
  return permissions.some(
    (permission) =>
      permission.action === "publish" &&
      permission.access === "own" &&
      userId === authorId
  )
}

export const canPublish = (
  permissions: Permissions,
  userId: string,
  authorId: string
) => {
  return {
    canPublishAny: canPublishAny(permissions),
    canPublishOwn: canPublishOwn(permissions, userId, authorId),
  }
}
