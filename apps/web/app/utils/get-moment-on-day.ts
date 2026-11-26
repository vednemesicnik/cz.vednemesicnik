/**
 * The present time of day carried to another day: a publish date chosen as
 * *Jiný den* keeps the moment of confirmation (design 23f, 22c).
 *
 * @param day - The chosen day, `YYYY-MM-DD`.
 * @param now - The moment of confirmation.
 * @returns That day at `now`'s time.
 */
export const getMomentOnDay = (day: string, now = new Date()) => {
  const [year, month, date] = day.split('-').map(Number)
  const moment = new Date(now)
  moment.setFullYear(year, month - 1, date)

  return moment
}
