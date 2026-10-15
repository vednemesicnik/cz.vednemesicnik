const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// The accusative after „Editor byl … bez připojení“: one, two to four, five on.
const pickForm = (count: number, forms: [string, string, string]) =>
  count === 1 ? forms[0] : count >= 2 && count <= 4 ? forms[1] : forms[2]

/**
 * How long the editor heard nothing from the server, for *Článek se mezitím
 * změnil* (design 24i, copy zqe81r3k and kjcijk1q). Minutes under an hour,
 * hours under two days, days after that; the unit follows the real length,
 * and hours and days admit they are rounded.
 *
 * @param milliseconds - The silence; under a minute counts as one.
 * @returns „1 minutu“, „14 minut“, „přibližně 3 hodiny“, „přibližně 2 dny“.
 */
export const formatAwayDuration = (milliseconds: number) => {
  if (milliseconds < HOUR) {
    const minutes = Math.max(1, Math.round(milliseconds / MINUTE))
    return `${minutes} ${pickForm(minutes, ['minutu', 'minuty', 'minut'])}`
  }

  if (milliseconds < 48 * HOUR) {
    const hours = Math.round(milliseconds / HOUR)
    return `přibližně ${hours} ${pickForm(hours, ['hodinu', 'hodiny', 'hodin'])}`
  }

  const days = Math.round(milliseconds / (24 * HOUR))
  return `přibližně ${days} ${pickForm(days, ['den', 'dny', 'dní'])}`
}
