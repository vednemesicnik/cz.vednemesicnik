import { getLinkPlatform } from './get-link-platform'
import { isValidEpisodeLinkUrl } from './is-valid-episode-link-url'

/**
 * What the line under a link's label says (design 27d, 2o0uwhgp), derived
 * from the label and the address, never stored:
 * - `filled` — the platform's name, from the address: *Doplněno podle
 *   adresy.*, and the label keeps following it;
 * - `manual` — another name beside a known platform: *Změněno ručně.*;
 * - `missing` — no name for a valid address, typically of another platform:
 *   *Doplňte název platformy.*, a description, not an error;
 * - `null` — nothing, also for an invalid address, whose error says enough.
 */
export type LinkLabelState = 'filled' | 'manual' | 'missing' | null

/**
 * @param link - The label and the address as typed.
 * @returns The label's {@link LinkLabelState}.
 */
export const getLinkLabelState = ({
  label,
  url,
}: {
  label: string
  url: string
}): LinkLabelState => {
  const name = label.trim()
  const address = url.trim()

  if (name !== '') {
    const platform = getLinkPlatform(address)
    // A name for another platform was never filled in, so nothing changed it.
    if (platform === null) return null
    return name === platform ? 'filled' : 'manual'
  }

  // A known platform's name fills itself, unless it was cleared by hand.
  return isValidEpisodeLinkUrl(address) ? 'missing' : null
}
