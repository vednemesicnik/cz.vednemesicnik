/**
 * Sends the magic-link sign-in email through the Google Apps Script web app
 * (see the SCRIPT__Auth__Magic_Link repo). Best-effort: the sign-in request
 * action returns the same neutral response whether or not delivery succeeds, so
 * this never throws — failures are logged and swallowed.
 *
 * No-ops when GAS_MAGIC_LINK_URL / GAS_MAGIC_LINK_SECRET are unset (local
 * development), so the flow can be exercised without a live GAS deployment.
 */
export const sendMagicLinkEmail = async ({
  email,
  link,
}: {
  email: string
  link: string
}) => {
  const url = process.env.GAS_MAGIC_LINK_URL
  const secret = process.env.GAS_MAGIC_LINK_SECRET

  if (!url || !secret) {
    console.warn(
      '[magic-link] GAS_MAGIC_LINK_URL/SECRET not set — skipping email send.',
    )
    return
  }

  try {
    const response = await fetch(url, {
      body: JSON.stringify({ email, link, secret }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const result = (await response.json().catch(() => ({ ok: false }))) as {
      ok?: boolean
    }

    if (!response.ok || !result.ok) {
      console.error(
        `[magic-link] GAS send failed — status ${response.status}, ok ${result.ok}.`,
      )
    }
  } catch (error) {
    console.error('[magic-link] GAS request threw —', error)
  }
}
