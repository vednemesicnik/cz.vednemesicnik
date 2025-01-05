export const getFormattedDateString = (date: Date | null) => {
  return date === null ? undefined : date.toISOString().split("T")[0]
}
