export const getFormattedPublishDate = (date: string | null) => {
  if (!date) {
    return "..."
  }

  return new Date(date).toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
