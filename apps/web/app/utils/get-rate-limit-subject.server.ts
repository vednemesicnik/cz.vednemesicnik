import { isIP } from 'node:net'

/**
 * What the limiter counts for an address. One household or phone holds a whole IPv6 /64
 * and can walk through it, so the limit counts the /64 and the logs keep the address.
 */
export function getRateLimitSubject(address: string): string {
  if (isIP(address) !== 6 || address.includes('.')) return address

  const [head, tail] = address.toLowerCase().split('::')
  const headGroups = head ? head.split(':') : []
  const tailGroups = tail ? tail.split(':') : []
  const zeros = Array.from(
    { length: 8 - headGroups.length - tailGroups.length },
    () => '0',
  )
  const network = [...headGroups, ...zeros, ...tailGroups]
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ''))
    .join(':')

  return `${network}::/64`
}
