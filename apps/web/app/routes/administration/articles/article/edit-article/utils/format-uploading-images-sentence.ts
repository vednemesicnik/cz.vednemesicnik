const pluralRules = new Intl.PluralRules('cs')

/**
 * The close dialog's sentence while images still upload (design 24b, copy
 * fmsjg9oc): closing the editor cancels them.
 *
 * @param count - The images uploading now, new and replacements alike.
 * @returns „Obrázek se ještě nahrává. …“, „2 obrázky se ještě nahrávají. …“
 *   or „5 obrázků se ještě nahrává. …“.
 */
export const formatUploadingImagesSentence = (count: number) => {
  switch (pluralRules.select(count)) {
    case 'one':
      return 'Obrázek se ještě nahrává. Po zavření se jeho nahrávání zruší.'
    case 'few':
      return `${count} obrázky se ještě nahrávají. Po zavření se jejich nahrávání zruší.`
    default:
      return `${count} obrázků se ještě nahrává. Po zavření se jejich nahrávání zruší.`
  }
}
