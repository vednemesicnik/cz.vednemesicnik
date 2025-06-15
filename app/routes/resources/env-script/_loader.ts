import { getContentHash } from '~/utils/hash.server';

export async function loader() {
  const script = `window.ENV = ${JSON.stringify(ENV)};`;
  const version = getContentHash(script);

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, immutable, max-age=31536000',
      ETag: `"${version}"`,
    },
  });
}
