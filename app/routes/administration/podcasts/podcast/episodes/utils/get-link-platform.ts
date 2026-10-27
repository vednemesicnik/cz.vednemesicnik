import { isValidEpisodeLinkUrl } from './is-valid-episode-link-url'

// The platforms the editor names from the address (design 27d, tly4a163).
const PLATFORM_BY_HOST: Record<string, string> = {
  'music.youtube.com': 'YouTube',
  'on.soundcloud.com': 'SoundCloud',
  'open.spotify.com': 'Spotify',
  'podcasts.apple.com': 'Apple Podcasts',
  'soundcloud.com': 'SoundCloud',
  'youtu.be': 'YouTube',
  'youtube.com': 'YouTube',
}

/**
 * The platform an episode link leads to, by its address (design 27d): the
 * name its label fills with.
 *
 * @param url - The address as typed.
 * @returns „Spotify“, „Apple Podcasts“, „YouTube“ or „SoundCloud“; `null`
 *   for another platform or an invalid address.
 */
export const getLinkPlatform = (url: string) => {
  if (!isValidEpisodeLinkUrl(url)) return null

  const host = new URL(url).hostname.replace(/^(www|m)\./, '')

  return PLATFORM_BY_HOST[host] ?? null
}
