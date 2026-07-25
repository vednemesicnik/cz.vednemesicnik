// Action-only endpoint. A loader exists purely so a stray GET answers with 405
// instead of React Router's "you made a GET request but did not provide a loader".
export const loader = () => {
  throw new Response('Method Not Allowed', {
    headers: { Allow: 'POST' },
    status: 405,
  })
}
