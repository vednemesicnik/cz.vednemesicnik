export const loader = async () => {
  throw new Response(
    'Tato sekce administrace bohužel neexistuje. Možná byla odstraněna nebo jste zadali špatnou adresu.',
    {
      status: 404,
      statusText: 'Sekce nenalezena',
    },
  )
}
