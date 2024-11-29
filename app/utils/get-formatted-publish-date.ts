export const getFormattedPublishDate = (date: Date | null) => {
  if (date === null) {
    return "..."
  }

  return new Date(date).toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
