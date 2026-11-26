import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'

import type { EditHolder } from './edit-hold-result'

type Options = {
  /** Who holds the content now. */
  holder: EditHolder
  /** ISO 8601: the editor's own last save, or what it loaded. */
  ownLastSavedAt: string
  /** How long the editor heard nothing from the server before this answer. */
  awayMilliseconds: number
}

/**
 * Tells an editor that lost its hold while away from one taken over while it
 * was there (design 24h, 24i). Away means silent for longer than a hold lasts,
 * so the hold expired and someone took it freely; changed means saved since
 * the editor's own last save. Only both together are 24i: a takeover the
 * editor hears of at once is 24h even if the new holder already saved.
 *
 * @param options - The holder, the editor's own last save and its silence.
 * @returns `true` for *Článek se mezitím změnil* (24i), `false` for *Úpravu
 *   přebírá …* (24h).
 */
export const isChangedWhileAway = ({
  holder,
  ownLastSavedAt,
  awayMilliseconds,
}: Options): boolean =>
  awayMilliseconds > EDIT_HOLD_CONFIG.durationMilliseconds &&
  new Date(holder.lastSavedAt).getTime() !== new Date(ownLastSavedAt).getTime()
