const pluralRules = new Intl.PluralRules('cs')

/**
 * The close dialog's sentence once nothing uploads and some uploads failed
 * while it was open (design 24b, moo05ljj, copy fmsjg9oc).
 *
 * @param count - The uploads that failed since the dialog opened.
 * @returns „Obrázek se nepodařilo nahrát.“, „2 obrázky …“ or „5 obrázků …“.
 */
export const formatFailedUploadsSentence = (count: number) => {
  switch (pluralRules.select(count)) {
    case 'one':
      return 'Obrázek se nepodařilo nahrát.'
    case 'few':
      return `${count} obrázky se nepodařilo nahrát.`
    default:
      return `${count} obrázků se nepodařilo nahrát.`
  }
}
