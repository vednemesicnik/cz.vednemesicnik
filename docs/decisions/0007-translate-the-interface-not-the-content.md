# 0007. Translate the interface, not the content

- Status: Accepted
- Date: 2026-07-19
- Issues: #290, #291

## Context

The site and the administration are Czech-only, with strings directly in components. An
English version was wanted for the interface.

## Decision

- Only the interface is translated (navigation, labels, messages, meta). Articles, podcasts
  and other content stay Czech.
- Public website: the language comes from the URL. Czech is the default with no prefix,
  English lives under `/en/…`. No redirect by `Accept-Language`.
- Administration: the language comes from `User.language`, set in the profile. There is no
  URL prefix; `/en/administration` redirects to `/administration`.
- i18next and react-i18next, with the React Router integration written in the project (a
  route middleware with a per-request instance), not `remix-i18next`.

## Consequences

- Translating content is a separate future epic with its own data model.

## Alternatives considered

- A URL prefix in the administration — rejected: it sits behind sign-in, so SEO and shareable
  URLs do not apply, and the stored preference is enough.
