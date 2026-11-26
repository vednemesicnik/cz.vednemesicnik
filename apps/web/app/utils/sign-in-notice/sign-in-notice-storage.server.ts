import type { SubmissionResult } from '@conform-to/react'
import { createCookie, createCookieSessionStorage } from 'react-router'

/**
 * What a sign-in step hands to the page it redirects to (design 20): the sent
 * magic link (20b), a rejected request back at the chooser's field (20a), or
 * the end of the second factor on the password page (20d).
 */
export type SignInNotice =
  | { kind: 'magic-link-sent'; email: string }
  | {
      kind: 'magic-link-rejected'
      submissionResult: SubmissionResult<string[]>
    }
  | {
      kind: 'two-factor-ended'
      reason: 'locked' | 'expired'
      email: string | null
    }

type SignInNoticeFlashData = {
  notice: SignInNotice
}

// A post/redirect/get carrier: read once by the page the step redirects to.
// `/administration`, not `/administration/sign-in`: the chooser's own Single
// Fetch request is `/administration/sign-in.data`, which that path doesn't
// match.
export const signInNoticeStorage = createCookieSessionStorage<
  Record<string, never>,
  SignInNoticeFlashData
>({
  cookie: createCookie('vdm_sign_in_notice', {
    httpOnly: true,
    maxAge: 60,
    path: '/administration',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})
