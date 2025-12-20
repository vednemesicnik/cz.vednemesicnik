export const getFormattedPublishDate = (date: Date | null) => {
  if (date === null) {
    return '...'
  }

  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
