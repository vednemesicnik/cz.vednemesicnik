import { Prisma } from '@generated/prisma/client'
import type { FilterTable } from '@generated/prisma/enums'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

// Presets are cheap rows, but nothing else bounds how many an authenticated user
// can write into the shared SQLite file.
export const SAVED_FILTER_LIMIT = 20

// `@@unique([userId, tableKey, name])`. Only the name clash is a user-correctable
// input error; everything else stays on the app-wide `throwDbError` path, which
// turns a Prisma error into a 400 Response and would swallow the field error.
const isDuplicateNameError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002'

type CreateFilterResult =
  | { filterId: string; status: 'success' }
  | { status: 'duplicate-name' }
  | { status: 'limit-reached' }

type RenameFilterResult = { status: 'duplicate-name' | 'success' }

/**
 * Loads a filter that the given user owns.
 *
 * @param options - The filter id and the id of the user the row must belong to.
 * @returns The row, or `null` when it does not exist *or* belongs to someone else —
 *   the two are deliberately indistinguishable so the endpoint cannot be used to
 *   probe for other users' filter ids.
 */
export const getOwnedFilter = async ({
  filterId,
  userId,
}: {
  filterId: string
  userId: string
}) => {
  return prisma.filter.findFirst({
    select: { id: true, isShared: true, tableKey: true },
    where: { id: filterId, userId },
  })
}

/**
 * Creates a preset, enforcing the per-table limit and the single-default rule.
 *
 * @param options - The preset to store, including its owner and canonical query.
 * @returns `success` with the new row's id, or the reason the create was refused.
 */
export const createFilter = async ({
  isDefault,
  isShared,
  name,
  query,
  tableKey,
  userId,
}: {
  isDefault: boolean
  isShared: boolean
  name: string
  query: string
  tableKey: FilterTable
  userId: string
}): Promise<CreateFilterResult> => {
  try {
    return await prisma.$transaction(
      async (transaction): Promise<CreateFilterResult> => {
        const count = await transaction.filter.count({
          where: { tableKey, userId },
        })

        if (count >= SAVED_FILTER_LIMIT) {
          return { status: 'limit-reached' }
        }

        if (isDefault) {
          await transaction.filter.updateMany({
            data: { isDefault: false },
            where: { isDefault: true, tableKey, userId },
          })
        }

        const filter = await transaction.filter.create({
          data: {
            isDefault,
            isShared,
            name,
            query,
            tableKey,
            user: { connect: { id: userId } },
          },
          select: { id: true },
        })

        return { filterId: filter.id, status: 'success' }
      },
    )
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return { status: 'duplicate-name' }
    }

    return throwDbError(error, 'Unable to create the filter.')
  }
}

/**
 * Renames a preset.
 *
 * @param options - The filter id and the new name.
 * @returns `duplicate-name` when the owner already has a preset of that name on the
 *   same table, `success` otherwise.
 */
export const renameFilter = async ({
  filterId,
  name,
}: {
  filterId: string
  name: string
}): Promise<RenameFilterResult> => {
  try {
    await prisma.filter.update({
      data: { name },
      where: { id: filterId },
    })

    return { status: 'success' }
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return { status: 'duplicate-name' }
    }

    return throwDbError(error, 'Unable to rename the filter.')
  }
}

/**
 * Replaces a preset's stored query with a freshly validated snapshot.
 *
 * @param options - The filter id and the canonical query to store.
 */
export const overwriteFilter = async ({
  filterId,
  query,
}: {
  filterId: string
  query: string
}) => {
  try {
    await prisma.filter.update({
      data: { query },
      where: { id: filterId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to overwrite the filter.')
  }
}

/**
 * Deletes a preset.
 *
 * @param options - The filter id.
 */
export const deleteFilter = async ({ filterId }: { filterId: string }) => {
  try {
    await prisma.filter.delete({ where: { id: filterId } })
  } catch (error) {
    throwDbError(error, 'Unable to delete the filter.')
  }
}

/**
 * Makes a preset the owner's default for its table.
 *
 * @param options - The filter id plus the owner and table the default is scoped to.
 */
export const setDefaultFilter = async ({
  filterId,
  tableKey,
  userId,
}: {
  filterId: string
  tableKey: FilterTable
  userId: string
}) => {
  try {
    // SQLite has no partial unique index, so "at most one default per user and
    // table" is enforced by unsetting and setting inside one transaction. Both
    // statements stay user-scoped so a stale id can never touch another user's rows.
    await prisma.$transaction([
      prisma.filter.updateMany({
        data: { isDefault: false },
        where: { isDefault: true, tableKey, userId },
      }),
      prisma.filter.updateMany({
        data: { isDefault: true },
        where: { id: filterId, userId },
      }),
    ])
  } catch (error) {
    throwDbError(error, 'Unable to set the default filter.')
  }
}

/**
 * Clears the default flag on a preset.
 *
 * @param options - The filter id.
 */
export const unsetDefaultFilter = async ({
  filterId,
}: {
  filterId: string
}) => {
  try {
    await prisma.filter.update({
      data: { isDefault: false },
      where: { id: filterId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to unset the default filter.')
  }
}

/**
 * Sets whether a preset is visible to the other administration users.
 *
 * @param options - The filter id and the sharing state to store.
 */
export const setSharedFilter = async ({
  filterId,
  isShared,
}: {
  filterId: string
  isShared: boolean
}) => {
  try {
    await prisma.filter.update({
      data: { isShared },
      where: { id: filterId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to change the filter sharing.')
  }
}
