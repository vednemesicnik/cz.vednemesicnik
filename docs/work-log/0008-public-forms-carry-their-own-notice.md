# 0008. Public forms carry their own data-protection notice

- Date: 2026-08-02
- Issues: #104, #385, #393

## Context

Public forms (donation confirmation, editorial board, membership) collect personal data. The
site has no privacy-policy page.

## Outcome

- No privacy-policy page. Each public form carries a self-contained data-protection paragraph
  directly above the submit button. There is no tick-box; submitting is the act.
- Consent is recorded with the submission in the destination Google Sheet, with its date.
- The audience is 15+, so no parental-consent path is built.
- Addresses that the public pages do not already show never go into code, docs or issues;
  they live in Script Properties or environment variables.

## What follows

- A new public form copies this pattern; the paragraph's wording goes through the
  copywriter.
