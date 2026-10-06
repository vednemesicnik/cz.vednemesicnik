import type { MetaFunction } from 'react-router'

export const meta: MetaFunction = () => {
  return [
    { title: 'Vedneměsíčník' },
    {
      content:
        'Studentské nekritické noviny: Vedneměsíčník je časopis, který píšeme my, studenti.',
      name: 'description',
    },
  ]
}
