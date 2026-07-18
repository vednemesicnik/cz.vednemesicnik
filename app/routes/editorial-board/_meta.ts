import type { MetaFunction } from 'react-router'

export const meta: MetaFunction = () => {
  return [
    { title: 'Vedneměsíčník | Redakce' },
    {
      content: 'Seznam členů a kontakt na redakci Vedneměsíčníku.',
      name: 'description',
    },
  ]
}
