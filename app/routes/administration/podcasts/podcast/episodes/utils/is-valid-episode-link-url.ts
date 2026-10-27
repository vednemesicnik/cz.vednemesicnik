/**
 * Whether an episode link's address is one a listener can open (design 27d,
 * 2o0uwhgp): it reads as an address and starts with `http://` or `https://`.
 * A draft saves an invalid one as typed; submitting and publishing refuse it.
 *
 * @param url - The address as stored.
 * @returns `true` for a valid address.
 */
export const isValidEpisodeLinkUrl = (url: string) => {
  if (!URL.canParse(url)) return false

  const { protocol } = new URL(url)

  return protocol === 'http:' || protocol === 'https:'
}
