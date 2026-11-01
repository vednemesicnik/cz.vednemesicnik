import { getPragueDate } from '~/utils/get-prague-date'

const AGE_OF_MAJORITY = 18

/**
 * Whether someone is under 18 on a given day in Europe/Prague: the statutes ask
 * for a guardian's signature from an applicant who is a minor on the day the
 * application is submitted. They turn 18 on their birthday; someone born on
 * 29 February, on 1 March of a common year.
 *
 * @param dateOfBirth - The day of birth as `YYYY-MM-DD`.
 * @param date - The moment to judge by.
 */
export const isMinorOnDate = (dateOfBirth: string, date: Date): boolean => {
  const today = getPragueDate(date)
  const year = Number(today.slice(0, 4))
  const adultBornBy = `${year - AGE_OF_MAJORITY}${today.slice(4)}`

  return dateOfBirth > adultBornBy
}
