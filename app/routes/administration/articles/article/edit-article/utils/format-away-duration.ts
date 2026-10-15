const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// The accusative after „Editor byl … bez připojení“: one, two to four, five on.
const pickForm = (count: number, forms: [string, string, string]) =>
  count === 1 ? forms[0] : count >= 2 && count <= 4 ? forms[1] : forms[2]

/**
 * How long the editor heard nothing from the server, for *Článek se mezitím
 * změnil* (design 24i, copy zqe81r3k). Minutes under an hour, hours under two
 * days, days after that.
 *
 * @param milliseconds - The silence; under a minute counts as one.
 * @returns „1 minutu“, „14 minut“, „3 hodiny“, „2 dny“.
 */
export const formatAwayDuration = (milliseconds: number) => {
  const minutes = Math.max(1, Math.round(milliseconds / MINUTE))

  if (minutes < 60) {
    return `${minutes} ${pickForm(minutes, ['minutu', 'minuty', 'minut'])}`
  }

  const hours = Math.round(milliseconds / HOUR)

  if (hours < 48) {
    return `${hours} ${pickForm(hours, ['hodinu', 'hodiny', 'hodin'])}`
  }

  const days = Math.round(hours / 24)

  return `${days} ${pickForm(days, ['den', 'dny', 'dní'])}`
}
